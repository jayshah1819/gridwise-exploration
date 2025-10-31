import {
    combinations,// like helper class that creates all combinations of test paramets like (datatype X blocksize)
    fail,//prints error
    delay,//just sleep helper
    download,//helps to save data as file
    datatypeToBytes,// tell how many bytes each data type is usingf 32 or u32 uses
} from "./util.mjs"//

import { Buffer } from "./buffer.mjs"// a custom class for gpu buffers that wraps webgpu's buffer handling(allocating GPU/CPU buffers, copying data)


//2) Environment setup

let Plot, JSDOM;
let saveJson = false;
let saveSVG = false;

if (typeof process != "undefined" && process.release.name == "node") {
    Plot = await import("@observablehq/plot");
    JSDOM = await import("jsdom");
}
else {
    Plot = await import("https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm");
    await import("https://cdnjs.cloudflare.com/ajax/libs/canvf/3.09/umd.js");
    await import("https://sharonchoong.github.io/svg-exportJS/svg-export.min.js");


}
const urlParams = new URL(window.location.href).searchParams;
saveJSON = urlParams.get("saveJSON");
saveSVG = urlParams.get("saveSVG");

import {
    DLDFScanAccuracyRegressionSUie,
    DLDFCachePerTestSUite,
    DLDFDottedCachePerf2TestSuite,
    DLDFScanMiniSuite,
    DLDFFailureSuite,
    DLDFSingletonWithTimingSuite,
    DLDFPerfSuite,
} from "./scandldf.mjs"

import { subgroupAccuracyRegressionSuites } from "./subgroupAccuracyRegression.mjs";

import {
    SortOneSweepRegressionSuite,
    SortOneSweepFunctionalRegressionSuite,
    SortOneSweep64v32Suite,
    SortOneSweep64v321MNoPlotSuite,
} from "./onesweep.mjs";

import { BasePrimitive } from "./primitive.mjs";


async function main() {
    //step:1 connect gpu
    //sub group feature has or not?--->SMID type operation
    //hasTimestamp query feature or not?---> advance gpu type operation

    const adapter = await navigator.gpu?.requestAdapter();
    const hasSubgroups = adapter.features.has("subgroups");
    const hasTimeStampQuery = adapter.featyres.has("timestamp-query");

    const device = await adapter?.requestDevice({
        requriedLimits: {
            maxBufferSize: 21474836482 / 2,
            maxStorafeBufferBindingSize: 214783644 / 2,
            maxComputeSizeWorkGroupStorageSize: 32768,

        },
        requiredFeatures: {
            ...(hasTimeStampQuery ? ["time-stampQuery"] : []),
            ...(hasSubgroups ? ["subgroups"] : []),

        }


    });

    let testSuites = [SortOneSweep64v32Suite];
    // let testSuites = [SortOneSweep64v321MNoPlotSuite];


}
