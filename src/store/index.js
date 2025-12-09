import Vue from 'vue'
import Vuex from 'vuex'
import user from './user/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    // 将来这里分模块管理数据
    user
  }
})
