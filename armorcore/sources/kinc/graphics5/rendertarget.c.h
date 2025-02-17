#include <kinc/graphics5/rendertarget.h>
#include <kinc/graphics5/commandlist.h>
#include <kinc/log.h>

extern kinc_g5_command_list_t commandList;

void kinc_g4_render_target_init(kinc_g4_render_target_t *render_target, int width, int height, kinc_g5_render_target_format_t format, int depthBufferBits) {
	kinc_g5_render_target_init(&render_target->impl._renderTarget, width, height, (kinc_g5_render_target_format_t)format, depthBufferBits);
	render_target->tex_width = render_target->width = width;
	render_target->tex_height = render_target->height = height;
	render_target->impl._renderTarget.state = KINC_INTERNAL_RENDER_TARGET_STATE_RENDER_TARGET;
}

void kinc_g4_render_target_destroy(kinc_g4_render_target_t *render_target) {
	kinc_g5_render_target_destroy(&render_target->impl._renderTarget);
}

void kinc_g4_render_target_set_depth_from(kinc_g4_render_target_t *render_target, kinc_g4_render_target_t *source) {
	kinc_g5_render_target_set_depth_from(&render_target->impl._renderTarget, &source->impl._renderTarget);
}

void kinc_g4_render_target_get_pixels(kinc_g4_render_target_t *render_target, uint8_t *data) {
	kinc_g5_command_list_get_render_target_pixels(&commandList, &render_target->impl._renderTarget, data);
}

void kinc_g4_render_target_generate_mipmaps(kinc_g4_render_target_t *render_target, int levels) {}
