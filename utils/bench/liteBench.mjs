export default function liteBench(intake) {
	let startTime = Date.now();
	for (let i = 0; i < 4194304; i ++) {
		intake();
	};
	console.debug(`Function ${intake.name || "<anonymous>"} took ${(Date.now() - startTime) / 4194304}ms per iteration.`);
};