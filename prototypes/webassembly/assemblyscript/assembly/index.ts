import {subtract} from './common';

// import "allocator/arena";
//
// var buffer = new ArrayBuffer(8);

// import {allocate_memory} from "allocator/arena";

// var ptr = allocate_memory(64);
// free_memory(ptr);


// function doSomething<T>(a: T): T {
//   if (isString<T>()) {
//     ... // eliminated if T is not a string
//   } else {
//     ... // eliminated if T is a string
//   }
// }
//

import "allocator/arena";

var buffer = new ArrayBuffer(8);

assert(buffer.byteLength == 8);


// Ambient declaration of external function signature
declare namespace env {
  export function add1(a: i32, b: i32): i32;
}

// Use function defined in rust
export function add(a: i32, b: i32): i32 {
  return env.add1(a, b);
}

// Store data in linear memory
export function dostore(offset: usize, value: i32): void {
  store<i32>(offset, value);
}

// Load data from linear memory
export function doload(offset: usize): i32 {
  return load<i32>(offset);
}

// Store a string in linear memory
export function storeloadtest(): bool {
  store<string>(8, "teststring");
  let loaded_string = load<string>(8);
  return loaded_string == "teststring";
}

// Return a string
let a: string = "tiger";
export function getString(): string {
  return a;
}

// export function setString(b: string): void {
//   a = b;


export function storestring(offset: usize): void {
  store<string>(offset, a);
}

export function loadstring(offset: usize): string {
  return load<string>(offset);
}

export class simpleclass {
   constructor(
     public lo: u32,
     public hi: u32 = 0
   ) {}

   static addLo(a: simpleclass, b: simpleclass): simpleclass {
     return new simpleclass(a.lo + b.lo);
   }
 }
//
export function testsimpleclass(): simpleclass {
  var a = new simpleclass(1);
  var b = new simpleclass(5);
  var c = simpleclass.addLo(a, b);
  return c;
}
