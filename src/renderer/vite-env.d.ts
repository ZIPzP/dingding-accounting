/// <reference types="vite/client" />

/**
 * Vite 资源导入类型声明
 * 支持 ?url 等资源导入语法（如 sql.js 的 wasm 文件）
 */
declare module '*.wasm?url' {
  const src: string;
  export default src;
}
