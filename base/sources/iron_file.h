#pragma once

#include <iron_global.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#define KINC_OUTDIR "out"
#ifdef KINC_ANDROID
struct AAsset;
struct __sFILE;
typedef struct __sFILE FILE;
#endif

#define KINC_FILE_TYPE_ASSET 0
#define KINC_FILE_TYPE_SAVE 1

typedef struct kinc_file_reader {
	void *data; // A file handle or a more complex structure
	size_t size;
	size_t offset; // Needed by some implementations

	bool (*close)(struct kinc_file_reader *reader);
	size_t (*read)(struct kinc_file_reader *reader, void *data, size_t size);
	size_t (*pos)(struct kinc_file_reader *reader);
	bool (*seek)(struct kinc_file_reader *reader, size_t pos);
} kinc_file_reader_t;

bool kinc_file_reader_open(kinc_file_reader_t *reader, const char *filepath, int type);
bool kinc_file_reader_from_memory(kinc_file_reader_t *reader, void *data, size_t size);
void kinc_file_reader_set_callback(bool (*callback)(kinc_file_reader_t *reader, const char *filename, int type));
bool kinc_file_reader_close(kinc_file_reader_t *reader);
size_t kinc_file_reader_read(kinc_file_reader_t *reader, void *data, size_t size);
size_t kinc_file_reader_size(kinc_file_reader_t *reader);
size_t kinc_file_reader_pos(kinc_file_reader_t *reader);
bool kinc_file_reader_seek(kinc_file_reader_t *reader, size_t pos);
float kinc_read_f32le(uint8_t *data);
float kinc_read_f32be(uint8_t *data);
uint64_t kinc_read_u64le(uint8_t *data);
uint64_t kinc_read_u64be(uint8_t *data);
int64_t kinc_read_s64le(uint8_t *data);
int64_t kinc_read_s64be(uint8_t *data);
uint32_t kinc_read_u32le(uint8_t *data);
uint32_t kinc_read_u32be(uint8_t *data);
int32_t kinc_read_s32le(uint8_t *data);
int32_t kinc_read_s32be(uint8_t *data);
uint16_t kinc_read_u16le(uint8_t *data);
uint16_t kinc_read_u16be(uint8_t *data);
int16_t kinc_read_s16le(uint8_t *data);
int16_t kinc_read_s16be(uint8_t *data);
uint8_t kinc_read_u8(uint8_t *data);
int8_t kinc_read_s8(uint8_t *data);

void kinc_internal_set_files_location(char *dir);
char *kinc_internal_get_files_location(void);
bool kinc_internal_file_reader_callback(kinc_file_reader_t *reader, const char *filename, int type);
bool kinc_internal_file_reader_open(kinc_file_reader_t *reader, const char *filename, int type);

typedef struct kinc_file_writer {
	void *file;
	const char *filename;
} kinc_file_writer_t;

bool kinc_file_writer_open(kinc_file_writer_t *writer, const char *filepath);
void kinc_file_writer_write(kinc_file_writer_t *writer, void *data, int size);
void kinc_file_writer_close(kinc_file_writer_t *writer);
