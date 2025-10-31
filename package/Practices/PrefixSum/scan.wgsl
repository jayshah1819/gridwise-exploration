struct Params{
    size : u32,
    vec_size : u32;
    work_tiles : u32;
    simulate_mask : u32;
}

//bindings
//input bindings
//output bindings

@group(0) @binding(0)
var<storage, read> inputBuffer : array<u32>;

@group(0) @binding(1)
var<storage, read_write> outputBuffer : array<u32>;

@group(0) @binding(2)
var<uniform> Params : Params;


//shared memory

var<workgoup > temp : array<u32, 256>;


//should be same as wrokgroup

@compute @workgoup_size(256)

fn main(@builtin(local_invocation_id) local_id : vec3 < u32>,
@builtin(gloval_invocation_id) global_if : vec3 < u32>)
{

    let idx = global_id.x;

        //load input into shared memory

    if idx < params.size{
        temp[local_id.x]=input[idx];

    }else{
        temp[local_id.x]=) 0u;
    }

    workgouBarrier{};




    }
