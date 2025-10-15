const computeShader = `
struct Uniforms {
    bounds: vec4<f32>
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> read_buffer: array<f32>;
@group(0) @binding(2) var<storage, read_write> write_buffer: array<f32>;

fn is_outside_bounds(coord: vec3<u32>, bounds: vec3<f32>) -> bool {
    return coord.x >= u32(bounds.x) || coord.y >= u32(bounds.y) || coord.z >= u32(bounds.z);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (is_outside_bounds(global_id, uniforms.bounds.xyz)) {
        return;
    }
    
    write_buffer[global_id.x] += read_buffer[global_id.x];
}
`;

const mnistMatrixMultiplyShader = `
struct Dimensions {
    M: u32,  
    N: u32,   
    K: u32   
}

@group(0) @binding(0) var<uniform> dims: Dimensions;
@group(0) @binding(1) var<storage, read> matrixA: array<f32>;  // Input or previous layer
@group(0) @binding(2) var<storage, read> matrixB: array<f32>;  // Weights
@group(0) @binding(3) var<storage, read> bias: array<f32>;     // Bias
@group(0) @binding(4) var<storage, read_write> result: array<f32>; // Output

@compute @workgroup_size(64, 64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let row = global_id.y;
    let col = global_id.x;
    
    if (row >= dims.M || col >= dims.N) {
        return;
    }
    
    var sum = 0.0;
    for (var k = 0u; k < dims.K; k++) {
        let a_val = matrixA[row * dims.K + k];
        let b_val = matrixB[k * dims.N + col];
        sum += a_val * b_val;
    }
    
    // Add bias and store result
    let output_index = row * dims.N + col;
    result[output_index] = sum + bias[col];
}
`;

const mnistActivationShader = `
@group(0) @binding(0) var<storage, read> input: array<f32>;
@group(0) @binding(1) var<storage, read_write> output: array<f32>;
@group(0) @binding(2) var<uniform> size: u32;

// ReLU activation function
fn relu(x: f32) -> f32 {
    return max(0.0, x);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= size) {
        return;
    }
    
    output[index] = relu(input[index]);
}
`;

const mnistSoftmaxShader = `
@group(0) @binding(0) var<storage, read> input: array<f32>;
@group(0) @binding(1) var<storage, read_write> output: array<f32>;
@group(0) @binding(2) var<storage, read_write> max_val: array<f32>;
@group(0) @binding(3) var<storage, read_write> sum_exp: array<f32>;

// First pass: find maximum
@compute @workgroup_size(64)
fn find_max(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= 10u) { // MNIST has 10 classes
        return;
    }
    
    // Find max for numerical stability
    var max_value = input[0];
    for (var i = 1u; i < 10u; i++) {
        max_value = max(max_value, input[i]);
    }
    max_val[0] = max_value;
}

// Second pass: compute softmax
@compute @workgroup_size(64)
fn compute_softmax(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= 10u) {
        return;
    }
    
    let max_value = max_val[0];
    let exp_val = exp(input[index] - max_value);
    
    // Compute sum of all exponentials
    var sum = 0.0;
    for (var i = 0u; i < 10u; i++) {
        sum += exp(input[i] - max_value);
    }
    
    output[index] = exp_val / sum;
}
`;

const mnistPreprocessShader = `
@group(0) @binding(0) var<storage, read> raw_image: array<u32>;  // Raw pixel data
@group(0) @binding(1) var<storage, read_write> normalized: array<f32>; // Normalized output

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= 784u) { // 28x28 = 784 pixels
        return;
    }
    
    // Normalize pixel values from [0, 255] to [0, 1]
    let pixel_value = f32(raw_image[index]);
    normalized[index] = pixel_value / 255.0;
}
`;
module.exports = {
    computeShader,
    mnistMatrixMultiplyShader,
    mnistActivationShader,
    mnistSoftmaxShader,
    mnistPreprocessShader
};