<template>
  <div class="contest">
    <template v-if="!needPass">
      <div
        class="notFound"
        v-show="notFound"
      >
        <el-empty description="肥肠抱歉，木有找到该比赛，返回重试吧。" />
      </div>
      <template v-if="!notFound">
        <div
          class="infoBox"
          ref="infoBox"
        >
          <div class="title">{{ contest.Title }}</div>
          <div class="text">创建者：{{ contest.UID }}</div>
          <div class="text">类型：{{ contest.Type == 1 ? "ACM" : "OI" }}</div>
          <div class="text">描述：{{ contest.Description }}</div>
          <div
            class="status"
            v-if="timePercent.status == 1"
          >
            <div
              class="point"
              style="background-color: #5ebd00"
            ></div>
            进行中
          </div>
          <div
            class="status"
            v-else
          >
            <div
              class="point"
              style="background-color: #ff3300"
            ></div>
            已结束
          </div>

          <div class="time">
            <div class="begin_time">
              {{ proxy.Utils.TimeTools.timestampToTime(contest.BeginTime) }}
            </div>
            <div class="left_time">
              {{
          proxy.Utils.TimeTools.timestampToInterval(
          timePercent.allTime - timePercent.lostTime,
          2
          )
          }}
            </div>
            <div class="end_time">
              {{ proxy.Utils.TimeTools.timestampToTime(contest.EndTime) }}
            </div>
          </div>
          <div class="process">
            <el-progress
              :text-inside="true"
              :stroke-width="24"
              :color="timePercent.color"
              :percentage="timePercent.percent"
            />
          </div>
        </div>
        <div
          class="problemList"
          ref="problemList"
        >
          <div class="functionBox">
            <div
              class="contestRank cursor_pointer"
              v-on:click="goToRank()"
            >
              查看排名
            </div>
            <div
              class="contestRank cursor_pointer"
              v-on:click="goToStatus()"
            >
              比赛状态
            </div>
          </div>
          <div class="nav">
            <div style="width: 90px">序号</div>
            <div style="width: calc(100% - 190px)">题目</div>
            <div style="width: 100px">通过情况</div>
          </div>
          <div
            class="item"
            v-for="(item, index) in contest.Data"
            :key="index"
          >
            <div
              class="flag cursor_pointer"
              v-on:click="goToProblem(item.PID)"
            >
              {{ proxy.Utils.TSBaseTools.numberToAlpha(index + 1) }}
            </div>
            <div
              class="title cursor_pointer"
              v-on:click="goToProblem(item.PID)"
            >
              {{ item.Title }}
            </div>
            <div class="status">
              <el-progress
                type="circle"
                :width="22"
                :stroke-width="3"
                :percentage="
            item.SubmitNum == 0 ? 0 : (item.ACNum / item.SubmitNum) * 100
          "
                :show-text="false"
                style="margin: 0 10px"
              />
              {{ item.ACNum + "/" + item.SubmitNum }}
            </div>
          </div>
        </div>

      </template>
    </template>
    <!-- 密码验证 -->
    <div
      v-show="needPass"
      class="needPass"
    >
      <div class="title">验证</div>
      <div class="input">
        <div class="label">密码</div>
        <Input
          v-model="inputPass"
          @click="getContestById(contest.CID , inputPass)"
          type="text"
        ></Input>
      </div>

      <div
        class="btn cursor_pointer"
        @click="getContestById(contest.CID , inputPass)"
      >
        <el-icon>
          <Unlock />
        </el-icon>
        &nbsp;确定
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, getCurrentInstance, reactive, ref, onUnmounted } from "vue";
import { usePageBufferedDataStore } from "../pinia/pageBufferdData";
import Input from "../components/MyComponents/Input.vue";
const { proxy } = getCurrentInstance() as any;
const pageBufferedDataStore = usePageBufferedDataStore();

var needPass = ref(false); //是否需要验证
var inputPass = ref(""); //检验密码
var notFound = ref(true); //未找到

//加载
var loading = reactive({
  contestInfo: null,
  problemList: null,
  init() {
    if (this.contestInfo) {
      this.contestInfo.close();
    }
    if (this.problemList) {
      this.problemList.close();
    }
    this.contestInfo = null;
    this.problemList = null;
  },
});

//比赛信息
type contestType = {
  Data: { PID: number; Title: string; ACNum: number; SubmitNum: number }[];
  BeginTime: number;
  CID: number;
  Type: number;
  Description: string;
  EndTime: number;
  IsPublic: number;
  Pass: string;
  Size: number;
  Title: string;
  UID: string;
  [item: string]: any;
};
var contest = reactive<contestType>({
  CID: null,
  Data: [],
  length: 0,
  BeginTime: 0,
  Type: 1,
  Description: "",
  EndTime: 0,
  IsPublic: 1,
  Pass: null,
  Size: 0,
  Title: "",
  UID: "",
  copy(data: any) {
    let tempProblemSequence = data.Problems.split(",");
    for (let temp in tempProblemSequence) {
      for (let p in data.Data) {
        if (tempProblemSequence[temp] == data.Data[p].PID) {
          contest.Data.push({
            PID: data.Data[p].PID,
            Title: data.Data[p].Title,
            ACNum: data.Data[p].ACNum,
            SubmitNum: data.Data[p].SubmitNum,
          });
          break;
        }
      }
    }
    contest.length = data.length;
    contest.BeginTime = data.BeginTime;
    contest.CID = data.CID;
    contest.Type = data.Type;
    contest.Description = data.Description;
    contest.EndTime = data.EndTime;
    contest.IsPublic = data.IsPublic;
    contest.Pass = data.Pass;
    contest.Size = data.Size;
    contest.Title = data.Title;
    contest.UID = data.UID;
  },
});

//时间进度条
type timePercentType = {
  status: number;
  percent: number;
  color: string;
  timmer: any;
  lostTime: number;
  allTime: number;
  timeDistance: number;
  [item: string]: any;
};
var timePercent = reactive<timePercentType>({
  status: 1,
  percent: 0,
  color: "#2cbbfe",
  timmer: null,
  lostTime: 0, //已流失时间
  allTime: 0, //比赛时间跨度
  timeDistance: 0, //本地时间与服务器时间间隔
  init() {
    timePercent.status = 1;
    timePercent.percent = 0;
    timePercent.color = "#2cbbfe";
    timePercent.timmer = null;
    timePercent.lostTime = 0;
    timePercent.allTime = 0;
    timePercent.timeDistance = 0;
    clearInterval(timePercent.timmer);
  },
  begin() {
    this.init();
    let now = Date.now() - this.timeDistance;
    if (now >= contest.EndTime) {
      this.percent = 100;
      this.color = "#9e9e9e";
      this.status = 0;
      return;
    }
    //已流失时间
    this.lostTime = now - contest.BeginTime;
    this.allTime = Math.abs(contest.EndTime - contest.BeginTime);
    this.timmer = setInterval(() => {
      this.lostTime += 1000;
      this.percent = Math.floor((this.lostTime / this.allTime) * 100);
      if (this.percent >= 100) {
        this.percent = 100;
        this.color = "#9e9e9e";
        this.status = 0;
        clearInterval(timePercent.timmer);
        return;
      } else if (this.percent >= 90) {
        this.color = "#f03e3e";
      } else if (this.percent >= 60) {
        this.color = "#ff8c00";
      } else if (this.percent >= 40) {
        this.color = "#bcee68";
      } else {
        this.color = "#66cd00";
      }
    }, 1000);
  },
});

async function init() {
  //检查路由参数完整性
  let CID = proxy.$route.params.CID;
  contest.CID = CID; //暂存一份在contest数据中
  if (!CID) {
    proxy.elMessage({
      message: "页面跳转异常，请重试。",
      type: "error",
    });
    needPass.value = false;
    return;
  }

  //检查竞赛密码
  let temp = pageBufferedDataStore.getContestRouterData(CID);
  let IsPublic = temp?.IsPublic ?? 1; //默认公开
  let Pass = temp?.Pass ?? "";
  if (IsPublic == -1) {
    //否公开
    checkContestPass(CID, Pass);
  } else if (IsPublic == 1) {
    //公开
    getContestById(CID, Pass);
  }
}

//验证密码
async function checkContestPass(CID: number, Pass: string) {
  if (Pass) {
    //尝试已有的密码
    getContestById(CID, Pass);
  } else {
    inputPass.value = "";
    needPass.value = true;
  }
}

//获取竞赛信息
async function getContestById(CID: number, Pass: string) {
  needPass.value = false;
  notFound.value = true;
  loading.init();
  loading.contestInfo = proxy.elLoading({
    node: proxy.$refs.infoBox,
  });
  loading.problemList = proxy.elLoading({
    node: proxy.$refs.problemList,
  });

  let params: { [item: string]: any } = { Pass };

  await proxy.$get("api/contest/" + CID, params).then((res: any) => {
    let data = res.data;
    // proxy.$log(res);
    if (data.code == 0) {
      contest.copy(data);
      pageBufferedDataStore.setContestRouterData(CID, Pass ? -1 : 1, Pass);
      notFound.value = false;
    } else if (data.code == 160504) {
      //密码错误
      checkContestPass(CID, "");
    } else if (data.code == 160503) {
      //未开始
      proxy.$router.push({
        path: "/Contests",
      });
    }
    proxy.codeProcessor(
      data?.code ?? 100001,
      data?.msg ?? "服务器错误\\\\error"
    );
  });

  loading.init();
  //同步时间
  await proxy.getServerTime().then((res: any) => {
    let now = Date.now();
    if (res.time == null || Math.abs(res.time - now) < 1500) {
      timePercent.begin();
      return;
    }
    timePercent.timeDistance = now - res.time;
    timePercent.begin();
  });
}

//跳转到题目
function goToProblem(PID: number): void {
  proxy.$router.push({
    name: "ContestProblem",
    params: {
      PID,
      CID: contest.CID,
    },
  });
}

//跳转到当前比赛排名列表
function goToRank(): void {
  let CID = contest.CID;
  proxy.$router.push({
    name: "ContestRank",
    params: {
      CID,
    },
  });
}

//跳转到当前比赛的状态
function goToStatus(): void {
  let CID = contest.CID;
  let Pass: string;
  if (proxy.$route.params.Pass) Pass = proxy.$route.params.Pass;
  proxy.$router.push({
    path: "/ContestStatus",
    query: {
      CID,
      Pass,
    },
  });
}

onMounted(() => {
  init();
});

onUnmounted(() => {
  //回收定时器
  clearInterval(timePercent.timmer);
});
</script>

<style scoped lang="scss">
.contest {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: $contest_outerPaddingTop $contest_outerPaddingLeft;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .infoBox {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    padding: 30px;
    border-radius: 10px;
    @include fill_color("fill2");

    .title {
      font-size: $fontSize9;
      @include font_color("font1");
      margin: 20px 0;
    }

    .text {
      font-size: $fontSize4;
      @include font_color("font2");
    }

    .status {
      margin-top: 20px;
      font-size: $fontSize4;
      @include font_color("font2");
      display: flex;
      align-items: center;

      .point {
        border-radius: 50%;
        width: 8px;
        height: 8px;
        margin-right: 8px;
      }
    }

    .time {
      margin: 30px 0 15px 0;
      width: 100%;
      font-size: $fontSize4;
      @include font_color("font1");
      display: flex;
      justify-content: space-between;

      .left_time {
        font-size: $fontSize7;
        @include font_color("font1");
      }
    }

    .process {
      width: 100%;
      border-radius: 50%;
    }
  }

  .problemList {
    margin-top: $modelDistance;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    padding: 30px;
    border-radius: 10px;
    @include fill_color("fill2");

    .functionBox {
      width: 100%;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      border-radius: 10px;
      @include fill_color("fill2");
      padding-bottom: 30px;

      > div {
        margin: 0 10px;
        width: 140px;
        line-height: 32px;
        @include font_color("font2");
        font-size: $fontSize6;
        @include fill_color("fill4");
        @include box_shadow(0, 0, 2px, 1px, "border1");
        border-radius: 10px;
        text-align: center;

        &:hover {
          @include font_color("font1");
          @include fill_color("fill13");
          @include box_shadow(0, 0, 2px, 1px, "fill11");
        }
      }
    }

    .nav {
      width: 100%;
      display: flex;
      margin-bottom: 15px;

      > div {
        font-size: $fontSize6;
        @include font_color("font1");
      }
    }

    .item {
      box-sizing: border-box;
      padding: 15px 10px;
      width: 100%;
      display: flex;
      align-items: center;
      border-bottom: 1px solid;
      @include border_color("border1");
      @include fill_color("fill4");
      box-sizing: border-box;
      transition: all 300ms;

      &:hover {
        border-left: 8px solid;
        border-right: 8px solid;
        @include border_color("fill51");
      }

      &:last-child {
        border-bottom: none;
      }

      .flag {
        width: 80px;
        font-size: $fontSize6;
        @include font_color("fill11");
      }

      .title {
        width: calc(100% - 170px);
        font-size: $fontSize7;
        @include font_color("fill11");
      }

      .status {
        width: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $fontSize4;
        @include font_color("font3");
      }
    }
  }

  .needPass {
    top: calc(50vh - 200px);
    position: absolute;
    width: 400px;
    @include fill_color("fill2");
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    @include font_color("font1");
    @include box_shadow(0, 0, 3px, 1px, "border1");
    box-sizing: border-box;
    padding: 16px;

    > .title {
      font-size: $fontSize8;
    }

    > .input {
      display: flex;
      align-items: center;
      margin: 20px 0;

      > .label {
        width: 100px;
        font-size: $fontSize6;
        padding: 0 10px;
        text-align: right;
      }
    }
  }
}

.notFound {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  position: relative;
  overflow: hidden;
  margin: 8px 0;
  width: 220px;
  height: 40px;
  border-radius: 15px;
  font-size: $fontSize5;
  @include font_color("font1");
  letter-spacing: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  @include box_shadow(0, 0, 2px, 1px, "border2");
  transition-duration: 200ms;

  &:hover {
    @include box_shadow(0, 0, 2px, 1px, "fill12");
    @include fill_color("fill15");
  }
}
</style>