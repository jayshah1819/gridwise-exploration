// STEP 1: Simple shader that adds two arrays
const addArraysShader = `
@group(0) @binding(0) var<storage, read> arrayA: array<f32>;
@group(0) @binding(1) var<storage, read> arrayB: array<f32>;
@group(0) @binding(2) var<storage, read_write> result: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= arrayLength(&arrayA)) {
        return;
    }
    
    result[index] = arrayA[index] + arrayB[index];
}
`;

class SimpleGPUCalculator {
    constructor() {
        this.device = null;
        this.pipeline = null;
        this.buffers = {};
    }

    // STEP 2: Initialize WebGPU
    async initialize() {
        //gpu device

        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        this.device = device;

    }

    // STEP 3: Create shader module and pipeline
    async createPipeline() {
        const shaderModule = this.device.createShaderModule({
            code: addArraysShader
        });
        this.pipeline = this.device.createComputePipeline(
            {
                module: shaderModule,
                entryPoint: 'main'
            }
        )

    };

    // STEP 4: Create and manage buffers
    createBuffers(size) {

        const bufferSize = size * 4;

        // Create three buffers: A, B ,C

        this.buffers.arrayA = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.buffers.arrayB = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.buffers.result = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
    }

    // STEP 5: Put data into buffers
    writeData(arrayA, arrayB) {

        // Convert to Float32Array (GPU format)
        const dataA = new Float32Array(arrayA);
        const dataB = new Float32Array(arrayB);

        // Write data to GPU buffers
        this.device.queue.writeBuffer(this.buffers.arrayA, 0, dataA);
        this.device.queue.writeBuffer(this.buffers.arrayB, 0, dataB);

    }

    // STEP 6: Execute the computation
    async compute(size) {


        // Create bind group (connect buffers to pipeline)
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.buffers.arrayA } },
                { binding: 1, resource: { buffer: this.buffers.arrayB } },
                { binding: 2, resource: { buffer: this.buffers.result } }
            ]
        });

        // Create command encoder
        const encoder = this.device.createCommandEncoder();

        // Start compute pass
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipeline);
        computePass.setBindGroup(0, bindGroup);

        // Calculate how many workgroups we need
        const workgroupSize = 64;
        const numWorkgroups = Math.ceil(size / workgroupSize);

        // Dispatch the work
        computePass.dispatchWorkgroups(numWorkgroups);
        computePass.end();

        // Submit to GPU
        this.device.queue.submit([encoder.finish()]);


    }

    // STEP 7: Get results back from GPU
    async getResults(size) {


        // Create a buffer we can read from
        const readBuffer = this.device.createBuffer({
            size: size * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

        // Copy result to readable buffer
        const encoder = this.device.createCommandEncoder();
        encoder.copyBufferToBuffer(
            this.buffers.result, 0,
            readBuffer, 0,
            size * 4
        );
        this.device.queue.submit([encoder.finish()]);

        // Wait for GPU to finish
        await this.device.queue.onSubmittedWorkDone();

        // Map and read the data
        await readBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = readBuffer.getMappedRange();
        const result = new Float32Array(arrayBuffer).slice();
        readBuffer.unmap();

        return result;
    }
}

// STEP 8: Test it!
async function testSimpleCalculator() {
    try {
        const calc = new SimpleGPUCalculator();

        // Initialize
        await calc.initialize();
        await calc.createPipeline();

        // Test data
        const arrayA = [1, 2, 3, 4, 5];
        const arrayB = [10, 20, 30, 40, 50];

        // Run computation
        calc.createBuffers(arrayA.length);
        calc.writeData(arrayA, arrayB);
        await calc.compute(arrayA.length);

        // Get results
        const result = await calc.getResults(arrayA.length);

        console.log("Input A:", arrayA);
        console.log("Input B:", arrayB);
        console.log("GPU Result:", Array.from(result));
        console.log("Expected:", arrayA.map((a, i) => a + arrayB[i]));

    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the test
testSimpleCalculator();

module.exports = { SimpleGPUCalculator, testSimpleCalculator };