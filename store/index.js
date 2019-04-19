import axios from 'axios'

export const state = () => ({
    isConnected: false,
    message: null,
    nowPlaying: {},
    recentlyPlayed: {},
    trackProgress: 0,
    isPlaying: false
})

export const mutations = {
    connectionChange(state, isConnected) {
        state.isConnected = isConnected
    },
    messageChange(state, message) {
        state.message = message
    },
    nowPlayingChange(state, nowPlaying) {
        state.nowPlaying = nowPlaying
    },
    isPlayingChange(state, isPlaying) {
        state.isPlaying = isPlaying
    },
    progressChange(state, {progress,duration}) {
      // console.log(progress,duration)
        state.trackProgress = (progress / duration) * 100
    },
    recentlyPlayedChange(state, recentlyPlayed) {
        state.recentlyPlayed = recentlyPlayed
    }
}

export const actions = {
    async nuxtServerInit({
        commit
    }) {
        try {
            const clientUrl = process.env.clientUrl
            const redisUrl = `${clientUrl}api/spotify/data/`
            const {
                data: {
                    is_connected
                }
            } = await axios.get(`${redisUrl}is_connected`)

            commit('connectionChange', is_connected)
            if (Boolean(is_connected)) {
                const data = await axios.get(`${clientUrl}api/spotify/now-playing`)

                commit('nowPlayingChange', data.data.item)
                commit('isPlayingChange', data.data.is_playing)
                commit('progressChange', data.data.progress_ms)
            }
        } catch (err) {
            console.error(err)
        }
    },
    updateProgress: ({commit,state}, props) => {
        commit('progressChange', props)
        return state.trackProgress
    },
    updateTrack: ({
        commit,
        state
    }, nowPlaying) => {
        commit('nowPlayingChange', nowPlaying)
        return state.nowPlaying
    },
    updateStatus: ({
        commit,
        state
    }, isPlaying) => {
        commit('isPlayingChange', isPlaying)
        return state.isPlaying
    },
    updateConnection: ({
        commit,
        state
    }, isConnected) => {
        commit('connectionChange', isConnected)
        return state.isConnected
    }
}