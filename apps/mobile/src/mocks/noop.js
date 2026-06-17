/**
 * 鸿蒙 gesture-handler 占位 mock。
 * react-native-screens 在 enableScreens(false) 降级后不需要真实 gesture-handler，
 * 这个 noop 模块只为消掉 Metro 打包报错。
 */
module.exports = {};
