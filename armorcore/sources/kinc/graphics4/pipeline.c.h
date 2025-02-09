#include "pipeline.h"

#include <stddef.h>

void kinc_g4_internal_pipeline_set_defaults(kinc_g4_pipeline_t *state) {
	for (int i = 0; i < 16; ++i)
		state->input_layout[i] = NULL;
	state->vertex_shader = NULL;
	state->fragment_shader = NULL;
	state->geometry_shader = NULL;
	state->tessellation_control_shader = NULL;
	state->tessellation_evaluation_shader = NULL;

	state->cull_mode = KINC_G4_CULL_NOTHING;

	state->depth_write = false;
	state->depth_mode = KINC_G4_COMPARE_ALWAYS;

	state->blend_source = KINC_G4_BLEND_ONE;
	state->blend_destination = KINC_G4_BLEND_ZERO;
	state->blend_operation = KINC_G4_BLENDOP_ADD;
	state->alpha_blend_source = KINC_G4_BLEND_ONE;
	state->alpha_blend_destination = KINC_G4_BLEND_ZERO;
	state->alpha_blend_operation = KINC_G4_BLENDOP_ADD;

	for (int i = 0; i < 8; ++i)
		state->color_write_mask_red[i] = true;
	for (int i = 0; i < 8; ++i)
		state->color_write_mask_green[i] = true;
	for (int i = 0; i < 8; ++i)
		state->color_write_mask_blue[i] = true;
	for (int i = 0; i < 8; ++i)
		state->color_write_mask_alpha[i] = true;

	state->color_attachment_count = 1;
	for (int i = 0; i < 8; ++i)
		state->color_attachment[i] = KINC_G4_RENDER_TARGET_FORMAT_32BIT;

	state->depth_attachment_bits = 0;

	state->conservative_rasterization = false;
}
