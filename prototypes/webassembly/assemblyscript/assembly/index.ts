import {subtract} from './common';

import "allocator/arena";


// Ambient declaration of external function signature
declare namespace env {
  export function add1(a: i32, b: i32): i32;
}

// Use function defined in rust
export function add(a: i32, b: i32): i32 {
  return env.add1(a, b);
}

// Use function imported from adjacent ts file
export function minus(a: i32, b: i32): i32 {
  return subtract(a, b);
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
let a: string = "hello";
export function getString(): string {
  return a;
}

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

// Function that takes generic type
export function genericfunc<T>(a: T): i32 {
  if (isString<T>()) {
    return parseInt(a);
  } else if (isInteger<T>()) {
    return a;
  } else {
    return a;
  }
}

export function test_generic(a: i32): i32 {
  return genericfunc(a);
}
