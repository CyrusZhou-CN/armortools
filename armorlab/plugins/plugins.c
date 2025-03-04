
#include "../../../base/plugins/plugin_api.h"
#include "iron_array.h"
#include "proc_texsynth/proc_texsynth.h"

FN(texsynth_inpaint) {
	int32_t w;
	JS_ToInt32(ctx, &w, argv[0]);
	int32_t h;
	JS_ToInt32(ctx, &h, argv[1]);
	size_t size;
	void *out = JS_GetArrayBuffer(ctx, &size, argv[2]);
	void *img = JS_GetArrayBuffer(ctx, &size, argv[3]);
	void *mask = JS_GetArrayBuffer(ctx, &size, argv[4]);
	bool tiling = JS_ToBool(ctx, argv[5]);
	texsynth_inpaint(w, h, out, img, mask, tiling);
	return JS_UNDEFINED;
}

void plugin_embed() {
	JSValue global_obj = JS_GetGlobalObject(js_ctx);

	BIND(texsynth_inpaint, 6);

	JS_FreeValue(js_ctx, global_obj);
}
