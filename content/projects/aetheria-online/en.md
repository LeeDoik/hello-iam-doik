## Problem

The term project was graded against 5,000 concurrent connections. The number came first and the server had to be designed to reach it, so the whole build was a matter of measuring how many players it currently held and pushing that up.

The first implementation stopped at around 3,000 CCU. As connections grew, the path that built and sent packets serialized into a bottleneck, and pushing the connection count only a little further made the latency visibly worse. It stalled just past half the target.

Correctness was a problem too. Several workers iterated the global connection list `g_clients` at the same time, which raced: if another thread touched the list mid-iteration, packets went to the wrong target or an already-closed session was held on to. It barely reproduced under light load, so it took a while to find.

Moving persistence from MySQL to MSSQL broke the very first save. A DELETE that removed zero rows returns `SQL_NO_DATA` over ODBC, and that return code was being treated as a failure. To the driver it was a normal answer — there was nothing to delete — but the code read it as an error and aborted the whole save path.

## Approach

WP_GUNMAYHEM, a 2025 team assignment, was a three-player shooter built on Winsock2 with one thread per connection, and it ran straight into the limit of threads growing in step with connections. That experience is what pointed this design at a single IOCP queue consuming socket, timer and DB completions together. With completion notifications arriving in one place, a worker only has to look at what finished, and the thread count is fixed by core count rather than by connection count.

Vision was cut into sectors. The map is a grid, and a player is only sent targets inside their own sector and the nine adjacent cells, so the server walks the neighbourhood instead of every connection. NPC AI was made lazy — only NPCs with a player nearby think — which is why about 200,000 of them can sit on the map while the number of active AIs grows only in proportion to the players online. The AI scripts run in a separate Lua VM per worker, so no VM is shared across threads.

A single timer heap struck by every worker is itself a contention point, so it became a min-heap split across eight shards. Shared structures moved to Intel TBB's `concurrent_hash_map` to cut lock contention, and the connection list that had raced got a name index, which removed the concurrent iteration entirely.

Two changes carried the network side. Coalescing a session's outgoing packets into one send was the first thing to open the wall at 3,000 CCU, and `TCP_NODELAY` stopped small packets from being held back, which took the move round-trip delay out. Both went in while measuring with the load client, so their effect could be stated as a number.

The DB layer was abstracted behind `IDbBackend`. MSSQL over ODBC is the default path, and an environment with no driver or instance falls back to a JSON file backend. After the migration incident I did not want to leave a single save path standing on its own.

Claude was used as an assistant for writing and reviewing code during implementation — the commits carry `Co-Authored-By: Claude Opus 4.8` — while the design, the measurements and the report were my own.

## Result

On one machine the server filled its 10,000 CCU design cap. The in-house STRESS_TEST client pushed connections up to `MAX_PLAYERS`, and the `[Reject] Server Full` log confirmed the cap had been reached. 5,000 was the grading target and 10,000 is what actually connected. That 10,000 is the `MAX_PLAYERS` cap written into the code, though, and I never raised the cap and measured again, so where this server actually gives out is unknown.

At 10,000 CCU the move round-trip latency logged by the server was about 20 ms. Both numbers, though, are localhost measurements taken with the server and the load client running on the same PC. Real network latency, bandwidth, and the traffic patterns of many separate machines are not in that measurement.

A profiler located the bottleneck. Worker threads accounted for 96.6% of total CPU, but only 0.6% of that was spent in their own code. The rest was time waiting on network I/O, which is why the next optimizations were looked for in the send path rather than in computation.

In content terms the map holds four biomes with 12,500 of each of four species, plus four bosses, for about 200,000 NPCs. Lazy activation means that number is a ceiling rather than a standing load. From 6 May to 14 June 2026 I built the server, the client, the DB layer and the load-test tool alone.

## What I learned

Iterating shared state from several threads at once is itself the source of the race. Rather than locking more precisely, removing the need to iterate — an index that finds an entry by name directly — erased the problem at its root. More concurrency bugs than I expected disappear when the data structure changes.

Reading a driver's return code as a plain failure loses the normal cases. `SQL_NO_DATA` was not an error but a report that no row matched, and folding it into failure broke the first save. Status codes from an external layer deserve to be read one by one before being collapsed into success and failure.

Performance goes up by building the tool that measures it. Without the STRESS_TEST client neither the wall at 3,000 nor the fact that coalescing opened it could have been stated as a number. The profiler's 96.6% against 0.6% was a one-line reason to optimize somewhere else entirely.

A number without its measurement conditions becomes an exaggeration. 10,000 CCU and about 20 ms came from localhost, with the server and the load client on one PC. The same server on a real network would produce different numbers, and knowing that limit while quoting them seemed better than dropping the numbers.
