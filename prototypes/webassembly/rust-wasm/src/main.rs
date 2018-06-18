extern crate parity_wasm;
extern crate wasmi;

use std::env::current_dir;

use wasmi::{Externals, ImportsBuilder, Module, ModuleImportResolver, ModuleInstance, NopExternals,
            RuntimeValue, Signature};

fn main() {
    let wasm_location = "wasm/untouched.wasm";
    let wasm_buffer = current_dir().unwrap().join(wasm_location);

    let module = parity_wasm::deserialize_file(&wasm_buffer).expect("File to be deserialized");

    {
        // Print out all exported entries
        let export_section = module.export_section().expect("No export section found");
        let entries = export_section.entries();
        println!("All exported entries!: {:#?}", entries);
    }

    let loaded_module = Module::from_parity_wasm_module(module).expect("Module to be valid");

    // Define function to be hosted externally for wasm module to use
    const ADD_FUNC_INDEX: usize = 0;

    struct HostExternals {}

    // Adding external function, accessible by wasm module
    impl Externals for HostExternals {
        fn invoke_index(
            &mut self,
            index: usize,
            args: wasmi::RuntimeArgs,
        ) -> Result<Option<RuntimeValue>, wasmi::Trap> {
            match index {
                ADD_FUNC_INDEX => {
                    let a: u32 = args.nth_checked(0)?;
                    let b: u32 = args.nth_checked(1)?;
                    let result = a + b;

                    Ok(Some(RuntimeValue::I32(result as i32)))
                }
                _ => panic!("Unimplemented function at {}", index),
            }
        }
    }

    impl HostExternals {
        fn _check_signature(&self, index: usize, signature: &Signature) -> bool {
            let (params, ret_ty): (&[wasmi::ValueType], Option<wasmi::ValueType>) = match index {
                ADD_FUNC_INDEX => (
                    &[wasmi::ValueType::I32, wasmi::ValueType::I32],
                    Some(wasmi::ValueType::I32),
                ),
                _ => return false,
            };
            signature.params() == params && signature.return_type() == ret_ty
        }
    }

    struct RuntimeModuleImportResolver;

    impl ModuleImportResolver for RuntimeModuleImportResolver {
        fn resolve_func(
            &self,
            field_name: &str,
            _signature: &Signature,
        ) -> Result<wasmi::FuncRef, wasmi::Error> {
            let func_ref = match field_name {
                "add1" => wasmi::FuncInstance::alloc_host(
                    Signature::new(
                        &[wasmi::ValueType::I32, wasmi::ValueType::I32][..],
                        Some(wasmi::ValueType::I32),
                    ),
                    ADD_FUNC_INDEX,
                ),
                _ => {
                    return Err(wasmi::Error::Instantiation(format!(
                        "Export {} not found",
                        field_name
                    )))
                }
            };
            Ok(func_ref)
        }
        fn resolve_memory(
            &self,
            field_name: &str,
            _descriptor: &wasmi::MemoryDescriptor,
        ) -> Result<wasmi::MemoryRef, wasmi::Error> {
            let memory_ref = match field_name {
                "test_memory" => {
                    wasmi::MemoryInstance::alloc(wasmi::memory_units::Pages(1), None).unwrap()
                }
                _ => {
                    return Err(wasmi::Error::Instantiation(format!(
                        "Export {} not found",
                        field_name
                    )))
                }
            };
            Ok(memory_ref)
        }
    }

    let mut sum_externals = HostExternals {};

    // Create new module instance using loaded parity wasm module and
    // Imports builder with our RuntimeModuleImportResolver
    let mut imports = ImportsBuilder::new();
    imports.push_resolver("env", &RuntimeModuleImportResolver);
    let main = ModuleInstance::new(&loaded_module, &imports)
        .expect("Failed to instantiate module")
        // .assert_no_start();
        .run_start(&mut sum_externals)
        .expect("Failed to start moduleinstance");

    // Test functions
    println!(
        "Sum Result, expecting 54: {:?}",
        main.invoke_export(
            "add",
            &[RuntimeValue::I32(2 as i32), RuntimeValue::I32(52 as i32)],
            &mut sum_externals
        ).expect(""),
    );

    println!(
        "Subtraction using imported fn: {:?}",
        main.invoke_export(
            "minus",
            &[RuntimeValue::I32(2 as i32), RuntimeValue::I32(52 as i32)],
            &mut sum_externals
        ).expect(""),
    );

    let _ = main.invoke_export(
        "dostore",
        &[RuntimeValue::I32(16 as i32), RuntimeValue::I32(123 as i32)],
        &mut NopExternals,
    );
    println!(
        "Load from store, expecting 123: {:?}",
        main.invoke_export("doload", &[RuntimeValue::I32(16 as i32)], &mut NopExternals)
            .expect(""),
    );

    println!(
        "Store-load test, expecting 1: {:?}",
        main.invoke_export("storeloadtest", &[], &mut NopExternals)
            .expect(""),
    );

    // Store string in memory, access and return here
    let _ = main.invoke_export(
        "storestring",
        &[RuntimeValue::I32(8 as i32)],
        &mut NopExternals,
    );
    println!(
        "Load string: {:?}",
        main.invoke_export(
            "loadstring",
            &[RuntimeValue::I32(8 as i32)],
            &mut NopExternals
        ).expect(""),
    );

    // Return string value from function
    let string_ptr = match main.invoke_export("getString", &[], &mut NopExternals)
        .expect("")
    {
        Some(result) => result,
        None => RuntimeValue::I32(0 as i32),
    };
    let ptr: u32 = match string_ptr {
        RuntimeValue::I32(val) => val as u32,
        _ => 0 as u32,
    };
    // Access the wasm runtime linear memory
    let extern_memval = main.export_by_name("memory")
        .expect("Failed to export memory");
    let extern_memory: &wasmi::MemoryRef = extern_memval
        .as_memory()
        .expect("Extern value is not Memory ");
    let length = extern_memory.get(ptr, 1).unwrap()[0];
    let string_result = String::from_utf8(
        extern_memory
            .get(ptr + 4, (length * 2) as usize)
            .unwrap()
            .into_iter()
            .filter(|x| x != &(0 as u8))
            .collect(),
    ).unwrap();
    println!("Return string from wasm function: {:?}", string_result,);

    // Attempting to treat the returned value as a c_str pointer
    // Not successfull this time
    use std::ffi::CStr;
    use std::os::raw::c_char;
    let c_ptr = ptr as *const c_char;
    println!("c_ptr: {:?}", c_ptr);
    unsafe {
        let c_string = CStr::from_ptr(c_ptr).to_string_lossy().into_owned();
        println!("string: {:?}", c_string);
    }

    // Attempting to treat the returned string ptr value as a raw rust pointer
    // Not successfull
    let rust_ptr: *const u8 = ptr as *const u8;

    unsafe {
        if let Some(val_back) = rust_ptr.as_ref() {
            println!("We got back the value: {}!", val_back);
        }
    }

    // Use generic function from wasm
    println!(
        "Result of generic: {:?}",
        main.invoke_export(
            "genericfunc",
            &[RuntimeValue::I32(8 as i32)],
            &mut NopExternals
        ).expect(""),
    );

    // Return class instance
    println!(
        "Test simple class: {:?}",
        main.invoke_export("testsimpleclass", &[], &mut NopExternals)
            .expect(""),
    );
}
