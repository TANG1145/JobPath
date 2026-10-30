// Recorded checks, not guarantees about future availability.
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
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "ff43b02e59dfa604386bb382034b2cd07c2bcd8a",
    "license": "MIT",
    "licenseFile": "license.md",
    "runtimeStatus": "passed",
    "scope": "javascript-es6：npm ci、生产构建；浏览器新增、完成与筛选通过；此实现使用内存存储，刷新会清空，不作为持久化示例",
    "repository": "https://github.com/tastejs/todomvc.git"
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
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "revision": "4eb82aedf58321da90332e5f7316b64d5914a6b1",
    "license": "MIT",
    "licenseFile": "LICENSE",
    "runtimeStatus": "partial",
    "scope": "安装与测试发现通过：45项；未执行浏览器测试。package.json称Apache-2.0，与LICENSE不一致，以LICENSE文件记录为准",
    "repository": "https://github.com/microsoft/playwright-examples.git"
  },
  "java-7": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=vtPkZShrvXQ",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  },
  "java-8": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=5rNk7m_zlAg",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  },
  "web-7": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=nTeuhbP7wdE",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  },
  "web-8": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=PkZNo7MFNFg",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  },
  "test-7": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=cHYq1MRoyI0",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  },
  "test-8": {
    "checkedAt": "2026-10-30T05:00:00.000Z",
    "playbackStatus": "blocked",
    "videoUrl": "https://www.youtube.com/watch?v=jydYq7oAtD8",
    "scope": "原频道视频页显示“请登录，以便我们确认你不是聊天机器人”；未完成播放验证，改用对应文档。"
  }
};

for(const direction of ['java','web','test'])for(let i=1;i<=4;i++)resourceAudit[`${direction}-${i}`]={checkedAt:'2026-10-30T05:04:00.000Z',contentStatus:'reviewed',scope:'官方文档页面与主题目录可读；链接至原站，不镜像。核验范围为主题和任务关联，未逐题执行全部教程。'};

resourceAudit['web-5'].dependencyStatus='needs-review';
resourceAudit['web-5'].scope+='；安装审计报告40项依赖问题（含2 critical），不作为可直接复制的生产模板，优先使用同技能文档。';
resourceAudit['test-6'].dependencyStatus='needs-review';
resourceAudit['test-6'].scope+='；安装审计报告2项high依赖问题，发布审核未通过。';
