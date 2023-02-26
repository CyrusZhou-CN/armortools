
let android = process.argv.indexOf("android") >= 0;
let ios = process.argv.indexOf("ios") >= 0;
let win_hlsl = process.platform === "win32" && process.argv.indexOf("opengl") < 0;
let d3d12 = process.argv.indexOf("direct3d12") >= 0;
let vulkan = process.argv.indexOf("vulkan") >= 0;
let raytrace = d3d12 || vulkan;
let metal = process.argv.indexOf("metal") >= 0;
let snapshot = process.argv.indexOf("--snapshot") >= 0;

let project = new Project("ArmorLab");
project.addSources("Sources");
project.addShaders("Shaders/*.glsl", { embed: snapshot });
project.addAssets("Assets/*", { destination: "data/{name}", embed: snapshot });
project.addLibrary("../../Libraries/iron");
project.addLibrary("../../Libraries/zui");
project.addLibrary("../../base");
project.addShaders("../armorcore/Shaders/*.glsl", { embed: snapshot });
project.addShaders("../base/Shaders/*.glsl", { embed: snapshot });
project.addAssets("../base/Assets/*", { destination: "data/{name}", embed: snapshot });
if (!snapshot) {
	project.addDefine("arm_noembed");
	project.addAssets("../base/Assets/extra/*", { destination: "data/{name}" });
}
project.addAssets("Assets/export_presets/*", { destination: "data/export_presets/{name}" });
project.addAssets("Assets/keymap_presets/*", { destination: "data/keymap_presets/{name}" });
project.addAssets("Assets/locale/*", { destination: "data/locale/{name}" });
project.addAssets("Assets/licenses/**", { destination: "data/licenses/{name}" });
project.addAssets("Assets/plugins/*", { destination: "data/plugins/{name}" });
project.addAssets("Assets/meshes/*", { destination: "data/meshes/{name}" });
project.addAssets("Assets/models/*.onnx", { destination: "data/models/{name}" });
project.addAssets("Assets/models/LICENSE.txt", { destination: "data/models/LICENSE.txt" });
project.addAssets("../base/Assets/licenses/**", { destination: "data/licenses/{name}" });
project.addAssets("../base/Assets/themes/*.json", { destination: "data/themes/{name}" });
project.addDefine("js-es=6");
project.addParameter("--macro include('arm.logic')");
project.addDefine("kha_no_ogg");
project.addDefine("zui_translate");
project.addDefine("arm_data_dir");
project.addDefine("arm_ltc");
project.addDefine("arm_skip_envmap");
project.addDefine("arm_taa");
project.addDefine("arm_veloc");
project.addDefine("arm_particles");
project.addParameter("-dce full");
project.addDefine("analyzer-optimize");

if (android) {
	project.addDefine("kha_android_rmb");
}

if (snapshot) {
	project.addDefine("arm_snapshot");
	project.addDefine("arm_image_embed");
	project.addDefine("arm_shader_embed");
	project.addParameter("--no-traces");
}

project.addAssets("Assets/readme/readme.txt", { destination: "{name}" });

if (android) {
	project.addAssets("Assets/readme/readme_android.txt", { destination: "{name}" });
}
else if (ios) {
	project.addAssets("Assets/readme/readme_ios.txt", { destination: "{name}" });
}

if (raytrace) {
	project.addAssets("../base/Assets/raytrace/*", { destination: "data/{name}", embed: snapshot });

	if (d3d12) {
		project.addAssets("../base/Shaders/raytrace/*.cso", { destination: "data/{name}", embed: snapshot });
		project.addAssets("Assets/readme/readme_dxr.txt", { destination: "{name}" });
	}
	else if (vulkan) {
		project.addAssets("../base/Shaders/raytrace/*.spirv", { destination: "data/{name}", embed: snapshot });
		project.addAssets("Assets/readme/readme_vkrt.txt", { destination: "{name}" });
	}
}

if (process.platform !== "darwin" && !raytrace && !android && !ios) {
	project.addDefine("rp_voxels");

	if (process.platform === "win32" && win_hlsl) {
		project.addShaders("../base/Shaders/voxel_hlsl/*.glsl", { embed: snapshot, noprocessing: true });
	}
	else {
		project.addShaders("../base/Shaders/voxel_glsl/*.glsl", { embed: snapshot });
	}
}

resolve(project);
