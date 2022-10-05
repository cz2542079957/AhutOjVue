import { createApp } from "vue";
import App from "./App.vue";
import init from "./init";
import router from "./router";
import store from "./store/index";
import mountServerFunctions from "./mountServerFunctions";

const app = createApp(App);
app.use(store);
app.use(router);
init(app);
app.mount("#app");
mountServerFunctions(app);
