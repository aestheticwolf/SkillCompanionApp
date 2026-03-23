let _dark = false;

export const themeStore = {
  get dark(): boolean {
    return _dark;
  },
  set dark(value: boolean) {
    _dark = value;
  },
};
