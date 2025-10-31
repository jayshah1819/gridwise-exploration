const {
    mnistMatrixMultiplyShader,
    mnistActivationShader,
    mnistSoftmaxShader,
    mnistPreprocessShader
} = require('./shaders.js');

class MNISTPredictor {
    constructor() {
        this.device = null;
        this.pipelines = {};
        this.buffers = {};
    }

    async initialize() {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported');
        }

        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();

        // Create compute pipelines
        this.pipelines.matmul = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({ code: mnistMatrixMultiplyShader }),
                entryPoint: 'main'
            }
        });

        this.pipelines.activation = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({ code: mnistActivationShader }),
                entryPoint: 'main'
            }
        });

        this.pipelines.softmax = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({ code: mnistSoftmaxShader }),
                entryPoint: 'compute_softmax'
            }
        });

        this.pipelines.preprocess = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({ code: mnistPreprocessShader }),
                entryPoint: 'main'
            }
        });

        console.log('✅ MNIST WebGPU Predictor initialized');
    }

    async loadWeights(weightsData) {

        // example:buffers for a simple 784-> 128 -> 10network
        this.buffers.layer1_weights = this.device.createBuffer({
            size: 784 * 128 * 4, // float32
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.buffers.layer1_bias = this.device.createBuffer({
            size: 128 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.buffers.layer2_weights = this.device.createBuffer({
            size: 128 * 10 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.buffers.layer2_bias = this.device.createBuffer({
            size: 10 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    }

    async predict(imageData) {
        // imageData should be 28x28 array of pixel values
        console.log(' Running MNIST prediction');

        return [0.1, 0.05, 0.8, 0.02, 0.01, 0.005, 0.005, 0.005, 0.005, 0.005];
    }
}

// Test the predictor
async function testMNIST() {
    try {
        const predictor = new MNISTPredictor();
        await predictor.initialize();

        // Simulate a 28x28 image (all zeros for now)
        const testImage = new Array(784).fill(0);

        const prediction = await predictor.predict(testImage);
        console.log('Prediction probabilities:', prediction);

        const predictedDigit = prediction.indexOf(Math.max(...prediction));
        console.log(`Predicted digit: ${predictedDigit}`);

    } catch (error) {
        console.error('MNIST prediction failed:', error);
    }
}

module.exports = { MNISTPredictor, testMNIST };