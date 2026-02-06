import NetInfo from "@react-native-community/netinfo";

export const listenToNetwork = (cb: (v: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    cb(!!state.isConnected);
  });
};
