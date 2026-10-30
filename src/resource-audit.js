// Measured source checks; upstream repositories require the linked patches.
export const resourceAudit={
  "java-5": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "500158f732419217507c7656904b8e6aa1bcc0d6",
    "license": "Apache-2.0",
    "licenseFile": "LICENSE.txt",
    "runtimeStatus": "passed",
    "scope": "PetTypeFormatterTests：3项通过；仅最小单元测试，未测试数据库或全站",
    "repository": "https://github.com/spring-projects/spring-petclinic.git"
  },
  "java-6": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "3f4cef01152596c19bc4d37939409358812b1421",
    "license": "Apache-2.0",
    "licenseFile": "LICENSE.txt",
    "runtimeStatus": "passed",
    "scope": "complete/GreetingControllerTests：2项通过，Spring REST上下文与接口测试",
    "repository": "https://github.com/spring-guides/gs-rest-service.git"
  },
  "web-5": {
    "checkedAt": "2026-10-30T05:31:24.850Z",
    "revision": "ff43b02e59dfa604386bb382034b2cd07c2bcd8a",
    "license": "MIT",
    "licenseFile": "license.md",
    "runtimeStatus": "passed",
    "scope": "固定提交应用JobPath补丁；全新安装、生产构建、npm audit零已知漏洞；浏览器新增、编辑、完成、筛选通过。原仓库锁文件仍有问题；内存存储刷新清空。",
    "repository": "https://github.com/tastejs/todomvc.git",
    "dependencyStatus": "patched",
    "guideUrl": "/public/resource-guide.html"
  },
  "web-6": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "4f340fdb1b619089bbf8ae5dc56c2c0866224306",
    "license": "MIT",
    "licenseFile": "LICENSE",
    "runtimeStatus": "passed",
    "scope": "create-vite/template-react：安装、生产构建通过；浏览器计数按钮从0变为1",
    "repository": "https://github.com/vitejs/vite.git"
  },
  "test-5": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "a7b2446ee41a7298d3a0bc22c52f3b8bacae1566",
    "license": "MIT",
    "licenseFile": "LICENSE",
    "runtimeStatus": "passed",
    "scope": "官方test_fixtures_order_dependencies.py：1项通过",
    "repository": "https://github.com/pytest-dev/pytest.git"
  },
  "test-6": {
    "checkedAt": "2026-10-30T05:31:24.850Z",
    "revision": "4eb82aedf58321da90332e5f7316b64d5914a6b1",
    "license": "MIT",
    "licenseFile": "LICENSE",
    "runtimeStatus": "passed",
    "scope": "固定提交应用JobPath补丁，Playwright 1.64.1；全新安装与npm audit零已知漏洞。API Mocking与Clock共7用例在Chromium/Firefox/WebKit均通过，共21项。替换连接失败的8个商店用例，不计入通过范围。",
    "repository": "https://github.com/microsoft/playwright-examples.git",
    "dependencyStatus": "patched",
    "guideUrl": "/public/resource-guide.html"
  },
  "java-7": {
    "checkedAt": "2026-10-30T05:28:00.541Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/2017/fall/shorts/http/http-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/x/shorts/http/",
    "playbackSeconds": 3.006958,
    "decodedFrames": 77,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "java-8": {
    "checkedAt": "2026-10-30T05:27:36.870Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/sql/2023/x/lectures/0/lecture0-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/sql/weeks/0/",
    "playbackSeconds": 3.010019,
    "decodedFrames": 77,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "web-7": {
    "checkedAt": "2026-10-30T05:27:53.761Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/web/2020/spring/lectures/6/lecture6-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/web/weeks/6/",
    "playbackSeconds": 3.00236,
    "decodedFrames": 76,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "web-8": {
    "checkedAt": "2026-10-30T05:27:47.019Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/web/2020/spring/lectures/5/lecture5-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/web/weeks/5/",
    "playbackSeconds": 3.007431,
    "decodedFrames": 76,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "test-7": {
    "checkedAt": "2026-10-30T05:27:13.938Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/python/2022/x/lectures/5/lecture5-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/python/weeks/5/",
    "playbackSeconds": 3.015535,
    "decodedFrames": 78,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "test-8": {
    "checkedAt": "2026-10-30T05:27:24.666Z",
    "playbackStatus": "passed",
    "videoUrl": "https://cdn.cs50.net/python/2022/x/lectures/3/lecture3-360p.mp4",
    "sourcePage": "https://cs50.harvard.edu/python/weeks/3/",
    "playbackSeconds": 3.01484,
    "decodedFrames": 78,
    "scope": "官方CDN 360p直链；无登录，实际播放超过3秒并解码画面。仅抽样播放，非整课验收；本机代理网络核验，其他网络未保证。"
  },
  "java-1": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "java-2": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "java-3": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "java-4": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "web-1": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "web-2": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "web-3": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "web-4": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "test-1": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "test-2": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "test-3": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  },
  "test-4": {
    "checkedAt": "2026-10-30T05:04:00.000Z",
    "contentStatus": "reviewed",
    "scope": "官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。"
  }
};
