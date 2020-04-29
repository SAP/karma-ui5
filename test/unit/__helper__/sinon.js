/**
 * @typedef SinonHelperCallObject
 * @type {object}
 * @property {any[]} args
 * @property {Function} assert
 */
/**
 * @typedef SinonHelperCall
 * @type {any[] | SinonHelperCallObject}
 */
/**
 * @param {import('ava').ExecutionContext} t
 * @param {import('sinon').SinonStub} stub
 * @param {SinonHelperCall[]} calls
 */
module.exports.assertCalls = (t, stub, ...calls) => {
	t.is(stub.callCount, calls.length,
		`${stub.name} should be called ${calls.length} times`);
	calls.forEach((call, i) => {
		const expectedArgs = Array.isArray(call) ? call : call.args;
		const actualArgs = stub.getCall(i).args;
		t.is(actualArgs.length, expectedArgs.length,
			`${stub.name} should be called with ${expectedArgs.length} arguments ` +
			`on call ${i+1}`
		);
		expectedArgs.forEach((expectedArg, k) => {
			const assertFn = Array.isArray(call) ? t.is : call.assert[k];
			assertFn(actualArgs[k], expectedArg,
				`${stub.name} should be called with expected value for ` +
				`argument ${k+i} on call ${i+1}`
			);
		});
	});
};
