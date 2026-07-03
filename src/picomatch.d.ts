declare module 'picomatch' {
  const picomatch: {
    isMatch(input: string, glob: string | string[]): boolean;
  };

  export default picomatch;
}
