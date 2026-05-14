declare module '*.lua?raw' {
  const code: string;
  export default code;
}

declare module '*.lua' {
  const code: string;
  export default code;
}