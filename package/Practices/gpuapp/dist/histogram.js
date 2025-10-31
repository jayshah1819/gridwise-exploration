const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();


//example inputs
const N = 1 << 27;
const inputValues = new Float32Array(N);
const intputBins = new Uint32Array(N);

const binsCounts = 2;

const opTYpe = 0;

//buffers

const inputBuffer = device.createBuffer({
    size: inputValues.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
}
);

const binsIndexBuffer = device.createBuffer({
    size: intputBins.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,

});

const binsBuffer = device.createBuffer({
    size: binsCounts * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage_DST,
});

const resultBuffer = createBuffer({
    size: binsCount * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_READ,
});

//upload data 

device.queue.writeBuffer(inputBuffer, 0, inputValues);
device.queue.writeBuffer(binsIndexBuffer, 0, inputBins);
device.queue.writeBuffer(binsBuffer, 0, new Float32Array(binsCount).fill(0));


//wgsl shader

const shaderCode = `
    struct Input{
        value: array<f32>,
    };
    struct BinIndices{
        bins:array<u32>,
};
    struct bins{
        data:array<f32>,
    };


    /*bindings*/

    @group(0) @binding(0) var<storage, read>inputs:Input;
    @group(0) @binding(1) var<storage, read>Bins;
    @group(0) @binding(2) var<storage, read_write>Bins;
    @group(0) @binding(3) var<uniform> params:u32;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id)gid:vec3<u32>){
        let i= gid.x;
        if(i>=arrayLength(&inputs.values)){
            return;
        }
        let bin = binIndices.bin[i];
        let val inputs.values[i];

        switch(params){
        case 0u:{
            atomicAdd(&bins.data[bin],val);
            }
            if(val<=old){
                if(atomicCompareExchangeWeark(&bins.data[bin],old,val).exchanged)}{
                    break;
            }
        }
    }
        case 2u:{
            loop{
            let old=atmoicLoad(&bins.dat[bin]);
            if(val>=old){
                break;
            }
            if(atomicCompareExchangeWeak(&bins.data[bin],old,exchange)){
                break;
            }
        }

    }
        default:{}

}
        }

};



`
// pipeline setup

const module = device.createShaderModule({ code: shaderCode });
const pipeline = deevice.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "main" },
});

//Uniform buffer for operator type
const opBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue(opBuffer, 0, new Uint32Array([opType]));

const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: binIndexBuffer } },
        { binding: 2, resource: { buffer: binsBuffer } },
        { binding: 3, resource: { buffer: opBuffer } },
    ],
})

const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(inputValues.length / 64));
pass.end();
encoder.copyBufferToBuffer(binsBuffer, 0, resultBuffer, 0, binsCount * 4);

device.queue.submit([encoder.finish()]);

// Read back result
await resultBuffer.mapAsync(GPUMapMode.READ);
const out = new Float32Array(resultBuffer.getMappedRange());
console.log("Final bins:", Array.from(out));
