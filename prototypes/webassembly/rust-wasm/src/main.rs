extern crate parity_wasm;
extern crate wasmi;

use std::env::{current_dir};

use wasmi::{Externals, ImportsBuilder, Module, ModuleInstance, ModuleImportResolver, RuntimeValue, Signature};

fn main() {
    let wasm_file = "wasm/untouched.wasm";
    let p = current_dir().unwrap().join(wasm_file);

    let module = parity_wasm::deserialize_file(&p).expect("File to be deserialized");

    {
        // Print out all exported entries
        let export_section = module.export_section().expect("No export section found");
        let entries = export_section.entries();
        println!("All exported entries!: {:?}", entries);
    }

    let loaded_module = Module::from_parity_wasm_module(module).expect("Module to be valid");

    const ADD_FUNC_INDEX: usize = 0;


    struct HostExternals {}

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
        fn check_signature(
            &self,
            index: usize,
            signature: &Signature
        ) -> bool {
            let (params, ret_ty): (&[wasmi::ValueType], Option<wasmi::ValueType>) = match index {
                ADD_FUNC_INDEX => (&[wasmi::ValueType::I32, wasmi::ValueType::I32], Some(wasmi::ValueType::I32)),
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
            _signature: &Signature
        ) -> Result<wasmi::FuncRef, wasmi::Error> {
            let func_ref = match field_name {
                "add1" => {
                    wasmi::FuncInstance::alloc_host(
                        Signature::new(&[wasmi::ValueType::I32, wasmi::ValueType::I32][..], Some(wasmi::ValueType::I32)),
                        ADD_FUNC_INDEX,
                    )
                },
                _ => {
                    return Err(wasmi::Error::Instantiation(
                        format!("Export {} not found", field_name),
                    ))
                }
            };
            Ok(func_ref)
        }
    }

    let mut sum_externals = HostExternals {};

    let mut imports = ImportsBuilder::new();
	imports.push_resolver("env", &RuntimeModuleImportResolver);

    // Create new module instance using loaded parity wasm module and
    // Imports builder with our RuntimeModuleImportResolver
    let main = ModuleInstance::new(&loaded_module, &imports)
        .expect("Failed to instantiate module")
        .assert_no_start();

    // Setup function name and arguments and invoke using external host functions
    let func_name = "add";
    let args2 = [RuntimeValue::I32(2 as i32), RuntimeValue::I32(52 as i32)];
    println!(
        "Result: {:?}",
        main.invoke_export(func_name, &args2, &mut sum_externals)
            .expect(""),
    );
}
