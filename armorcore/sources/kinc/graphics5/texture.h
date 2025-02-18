#pragma once

#include <kinc/global.h>
#include <kinc/backend/graphics5/texture.h>
#include <kinc/graphics5/pipeline.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

/*! \file texture.h
    \brief Provides functions for handling textures.
*/

typedef enum kinc_image_compression {
	KINC_IMAGE_COMPRESSION_NONE,
	KINC_IMAGE_COMPRESSION_DXT5,
	KINC_IMAGE_COMPRESSION_ASTC
} kinc_image_compression_t;

typedef enum kinc_image_format {
	KINC_IMAGE_FORMAT_RGBA32,
	KINC_IMAGE_FORMAT_GREY8,
	KINC_IMAGE_FORMAT_RGBA128,
	KINC_IMAGE_FORMAT_RGBA64,
	KINC_IMAGE_FORMAT_BGRA32
} kinc_image_format_t;

typedef struct kinc_g5_texture {
	int width;
	int height;
	kinc_image_format_t format;
	kinc_image_compression_t compression;
	void *data;
	bool _uploaded;
	Texture5Impl impl;
} kinc_g5_texture_t;

void kinc_g5_texture_init(kinc_g5_texture_t *texture, int width, int height, kinc_image_format_t format);
void kinc_g5_texture_init_from_bytes(kinc_g5_texture_t *texture, void *data, int width, int height, kinc_image_format_t format);
void kinc_g5_texture_init_non_sampled_access(kinc_g5_texture_t *texture, int width, int height, kinc_image_format_t format);
void kinc_g5_texture_destroy(kinc_g5_texture_t *texture);
uint8_t *kinc_g5_texture_lock(kinc_g5_texture_t *texture);
void kinc_g5_texture_unlock(kinc_g5_texture_t *texture);
void kinc_g5_texture_generate_mipmaps(kinc_g5_texture_t *texture, int levels);
void kinc_g5_texture_set_mipmap(kinc_g5_texture_t *texture, kinc_g5_texture_t *mipmap, int level);
int kinc_g5_texture_stride(kinc_g5_texture_t *texture);
