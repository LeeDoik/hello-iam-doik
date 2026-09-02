import { type DeployInfo, getDeployInfo } from "./deploy";

// 모듈 스코프 캐시: 정적 빌드는 로케일마다 Base.astro를 여러 번 렌더링하므로,
// git rev-parse를 매번 부르지 않고 빌드당 한 번만 계산한다.
let cached: DeployInfo | undefined;

export function cachedDeployInfo(repoUrl: string): DeployInfo {
  if (!cached) cached = getDeployInfo(repoUrl);
  return cached;
}
