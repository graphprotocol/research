(module
 (type $iii (func (param i32 i32) (result i32)))
 (import "env" "add1" (func $assembly/index/env.add1 (param i32 i32) (result i32)))
 (memory $0 1)
 (export "add" (func $assembly/index/add))
 (export "memory" (memory $0))
 (func $assembly/index/add (; 1 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  ;;@ assembly/index.ts:8:17
  (call $assembly/index/env.add1
   ;;@ assembly/index.ts:8:22
   (get_local $0)
   ;;@ assembly/index.ts:8:24
   (get_local $1)
  )
 )
)
