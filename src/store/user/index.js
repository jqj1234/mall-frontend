import { delUser, getUser, setUser } from '@/utils/storage'
const state = {
  sessionId: '',
  user: getUser() || {}
}

const mutations = {
  SET_SESSION_ID (state, sessionId) {
    state.sessionId = sessionId
  },
  SET_USER (state, user) {
    state.user = user
  }
}

const actions = {
  setSessionId ({ commit }, sessionId) {
    commit('SET_SESSION_ID', sessionId)
  },
  setUser ({ commit }, user) {
    commit('SET_USER', user)
    console.log(user)
    setUser(user)
  },
  clearUser ({ commit }) {
    commit('SET_USER', {})
    delUser()
  }
}

const getters = {
  getSessionId: state => state.sessionId,
  getUser: state => state.user
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
