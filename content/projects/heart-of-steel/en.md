## Problem

The goal was a design where removing the AI removes the game. The win condition of each of the four stages is judged live by an LLM rather than by a pre-written script, and the only thing the player does is talk in free text. In that structure a single model output becomes the game rule, so any place where the rule breaks is a bug.

The first wall was clue-word generation. When the words for all five allies came from one call, the model noticed the other words and avoided overlaps, and the arrest mechanic that depends on overlaps stopped working at all. The opposite failure also happened: one prompt line asking for "more direct" hints pushed the overlap rate to 83–100% and collapsed the puzzle outright.

The second was leaking the answer. The first attempt was an output filter that caught the secret word, but dialogue is streamed, so by the time the filter reacts the word is already on screen. A filter is an after-the-fact measure and could not be the real fix.

The third was balance. The early build had no losing condition, so no matter how badly the player played they eventually won — a game you could not lose. Without a path to being caught, the infiltration genre does not hold up.

## Approach

Instead of generating five clue words in one call, each ally got an independent call. The model does not see the other allies' words, so overlaps appear on their own and the amount of overlap becomes something a prompt can tune. Five concurrent calls returned 529 Overloaded, so concurrency was capped at 3 with maxRetries 5 and a fallback text, and disabling Sonnet's thinking cut the five-ally generation from 33 seconds to 17.

Leaks were closed with information design, not with a filter. The dialogue model never receives the secret code, the interrogation robot judge never receives the player's real identity, and the mansion judge prompt never receives the affinity number. A value the model was never given cannot leak, and the same rule was applied to all seven LLM call sites.

The interrogation uses two judges. The system knows the player's identity, so it can decide whether a statement is a lie; the model playing the robot does not know the identity, so it only decides whether a statement is inconsistent or evasive. Because the two judges answer from different information about the same question, the robot never catches the player using a fact it could not have known.

Models were split by role. Free dialogue is called often and its latency is felt, so it runs on claude-haiku-4-5; rule judging breaks the game when it is wrong, so it runs on claude-sonnet-5. The ten prompts were lifted out of the code into files under `src/data/prompts`, with a prompt studio so the designer could edit and re-run a prompt without opening server code.

Deployment went to Railway. Sessions are held in memory, so the process had to stay alive; the LFS-managed asset files number 570-600, which does not fit a static host's build pipeline; and a cold start making the first entry slow during judging was a risk worth paying to avoid.

The game you could not lose was fixed by building a path to being caught. Stage 3 got patrol robots (Sentry) with a cone of vision and a detection gauge that fills while you stay inside that cone and catches you when it is full (commit `8d75fd9`). Being caught restarts you at a checkpoint, so progress is not wiped, but a bad move is paid for in the time it takes to play the stretch again. Three explicit endings close the game out: being stopped at a checkpoint with zero magnet grenades, being reported at the mansion, and failing the interrogation judge.

The content-verification automation was built with Claude Code: five smoke tests that make real model calls and four deterministic static checks that call no model at all. That pipeline is what verified the AI-written code.

## Result

At submission it was an always-on deployment where one link took you straight in and all four stages could be finished. That instance no longer responds, so what remains is the repository and the demo video.

232 commits went in over 26 days. The team was two people: the other member owned game design, judging rules and asset intake, while the client and server code, the content of all four stages and the seven LLM call sites were all mine.

The overlap rate was tuned by measuring before and after each prompt change with the `npm run exp:diff` script. It came back from the 83–100% that broke the puzzle to below the 60% target line, settling at 42–50%, with the script output kept as the record. Five-ally generation latency went from 33 seconds to 17.

The dual interrogation judge was validated as pass/fail across 8 questions. The judge is itself an LLM and cannot be compared deterministically, so items where an exact string match is possible were separated from items that a model has to judge.

## What I learned

A guardrail is information design, not an output filter. When output leaves in fragments, as it does in streaming, a check after the fact is always one beat late, while a value the model was never given cannot escape by any route. After settling on that principle, every new call site started with the question of which values this model does not need to know.

One line of a prompt can break the balance. The sentence asking for more direct hints drove the overlap rate to 83–100%, and putting the affinity number into the mansion judge prompt made the model speak that number out loud in dialogue. The lines only became normal again once the number was replaced with words.

A value that changes server state does not belong in a client flag. Faking progression with a URL flag like `?stage2&key` drifted from the server session and desynced the key state. The rule became that state changes travel on a server request and the client only renders the state the server returns.

Regressions can be caught even in a probabilistic system. Four deterministic static checks run first — whether the required lines are still in the prompt files, whether the secret leaked into a prompt — and only the parts that genuinely need a call are covered by five LLM smoke tests. Separating what is allowed to vary from what must never vary was the starting point of the whole validation setup.
