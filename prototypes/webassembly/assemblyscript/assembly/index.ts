import {subtract} from './common';

declare namespace env {
  export function add1(a: i32, b: i32): i32;
}

export function add(a: i32, b: i32): i32 {
      return env.add1(a,b);
}
