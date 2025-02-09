#pragma once

#include <kinc/global.h>

#include <kinc/backend/graphics5/indexbuffer.h>

/*! \file indexbuffer.h
    \brief Provides functions for setting up and using index-buffers.
*/

typedef enum kinc_g5_index_buffer_format { KINC_G5_INDEX_BUFFER_FORMAT_32BIT, KINC_G5_INDEX_BUFFER_FORMAT_16BIT } kinc_g5_index_buffer_format_t;

typedef struct kinc_g5_index_buffer {
	IndexBuffer5Impl impl;
} kinc_g5_index_buffer_t;

void kinc_g5_index_buffer_init(kinc_g5_index_buffer_t *buffer, int count, kinc_g5_index_buffer_format_t format, bool gpu_memory);
void kinc_g5_index_buffer_destroy(kinc_g5_index_buffer_t *buffer);
void *kinc_g5_index_buffer_lock_all(kinc_g5_index_buffer_t *buffer);
void *kinc_g5_index_buffer_lock(kinc_g5_index_buffer_t *buffer, int start, int count);
void kinc_g5_index_buffer_unlock_all(kinc_g5_index_buffer_t *buffer);
void kinc_g5_index_buffer_unlock(kinc_g5_index_buffer_t *buffer, int count);
int kinc_g5_index_buffer_count(kinc_g5_index_buffer_t *buffer);
