;; Fast Inter Division, Direct Linear Expressions
;; GNU LGPL 3.0

(module
	;; This function forces integer division to skip floating-point arithmetic in JS. Calculation done in signed integers.
	(func (export "divRaw") (param i32 i32) (result i32)
		local.get 0
		local.get 1
		i32.div_s
	)
	;; This function uses pre-computed multiplication to skip division altogether. Calculation done in unsigned integers.
	(func (export "divPre") (param i32 i32) (result i32)
		local.get 0
		i64.extend_i32_u
		local.get 1
		i64.extend_i32_u
		i64.mul
		i64.const 32
		i64.shr_u
		i32.wrap_i64
	)
)
