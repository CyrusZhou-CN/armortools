
#include "iron_file.h"
#include <iron_system.h>
#ifdef KINC_ANDROID
#include <kinc/backend/android.h>
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef KINC_WINDOWS
#include <malloc.h>
#include <memory.h>
#endif

static bool memory_close_callback(kinc_file_reader_t *reader) {
	return true;
}

static size_t memory_read_callback(kinc_file_reader_t *reader, void *data, size_t size) {
	size_t read_size = reader->size - reader->offset < size ? reader->size - reader->offset : size;
	memcpy(data, (uint8_t *)reader->data + reader->offset, read_size);
	reader->offset += read_size;
	return read_size;
}

static size_t memory_pos_callback(kinc_file_reader_t *reader) {
	return reader->offset;
}

static bool memory_seek_callback(kinc_file_reader_t *reader, size_t pos) {
	reader->offset = pos;
	return true;
}

bool kinc_file_reader_from_memory(kinc_file_reader_t *reader, void *data, size_t size) {
	memset(reader, 0, sizeof(kinc_file_reader_t));
	reader->data = data;
	reader->size = size;
	reader->read = memory_read_callback;
	reader->pos = memory_pos_callback;
	reader->seek = memory_seek_callback;
	reader->close = memory_close_callback;
	return true;
}

#ifdef KINC_IOS
const char *iphonegetresourcepath(void);
#endif

#ifdef KINC_MACOS
const char *macgetresourcepath(void);
#endif

#ifdef KINC_WINDOWS
#include <kinc/backend/windows_mini.h>
#endif

static char *fileslocation = NULL;
static bool (*file_reader_callback)(kinc_file_reader_t *reader, const char *filename, int type) = NULL;
#ifdef KINC_WINDOWS
static wchar_t wfilepath[1001];
#endif

void kinc_internal_set_files_location(char *dir) {
	fileslocation = dir;
}

char *kinc_internal_get_files_location(void) {
	return fileslocation;
}

bool kinc_internal_file_reader_callback(kinc_file_reader_t *reader, const char *filename, int type) {
	return file_reader_callback ? file_reader_callback(reader, filename, type) : false;
}

#ifdef KINC_WINDOWS
static size_t kinc_libc_file_reader_read(kinc_file_reader_t *reader, void *data, size_t size) {
	DWORD readBytes = 0;
	if (ReadFile(reader->data, data, (DWORD)size, &readBytes, NULL)) {
		return (size_t)readBytes;
	}
	else {
		return 0;
	}
}

static bool kinc_libc_file_reader_seek(kinc_file_reader_t *reader, size_t pos) {
	// TODO: make this 64-bit compliant
	SetFilePointer(reader->data, (LONG)pos, NULL, FILE_BEGIN);
	return true;
}

static bool kinc_libc_file_reader_close(kinc_file_reader_t *reader) {
	CloseHandle(reader->data);
	return true;
}

static size_t kinc_libc_file_reader_pos(kinc_file_reader_t *reader) {
	// TODO: make this 64-bit compliant
	return (size_t)SetFilePointer(reader->data, 0, NULL, FILE_CURRENT);
}
#else
static size_t kinc_libc_file_reader_read(kinc_file_reader_t *reader, void *data, size_t size) {
	return fread(data, 1, size, (FILE *)reader->data);
}

static bool kinc_libc_file_reader_seek(kinc_file_reader_t *reader, size_t pos) {
	fseek((FILE *)reader->data, pos, SEEK_SET);
	return true;
}

static bool kinc_libc_file_reader_close(kinc_file_reader_t *reader) {
	if (reader->data != NULL) {
		fclose((FILE *)reader->data);
		reader->data = NULL;
	}
	return true;
}

static size_t kinc_libc_file_reader_pos(kinc_file_reader_t *reader) {
	return ftell((FILE *)reader->data);
}
#endif

bool kinc_internal_file_reader_open(kinc_file_reader_t *reader, const char *filename, int type) {
	char filepath[1001];
#ifdef KINC_IOS
	strcpy(filepath, type == KINC_FILE_TYPE_SAVE ? kinc_internal_save_path() : iphonegetresourcepath());
	if (type != KINC_FILE_TYPE_SAVE) {
		strcat(filepath, "/");
		strcat(filepath, KINC_OUTDIR);
		strcat(filepath, "/");
	}

	strcat(filepath, filename);
#endif
#ifdef KINC_MACOS
	strcpy(filepath, type == KINC_FILE_TYPE_SAVE ? kinc_internal_save_path() : macgetresourcepath());
	if (type != KINC_FILE_TYPE_SAVE) {
		strcat(filepath, "/");
		strcat(filepath, KINC_OUTDIR);
		strcat(filepath, "/");
	}
	strcat(filepath, filename);
#endif
#ifdef KINC_WINDOWS
	if (type == KINC_FILE_TYPE_SAVE) {
		strcpy(filepath, kinc_internal_save_path());
		strcat(filepath, filename);
	}
	else {
		strcpy(filepath, filename);
	}
	size_t filepathlength = strlen(filepath);
	for (size_t i = 0; i < filepathlength; ++i)
		if (filepath[i] == '/')
			filepath[i] = '\\';
#endif
#if defined(KINC_LINUX) || defined(KINC_ANDROID)
	if (type == KINC_FILE_TYPE_SAVE) {
		strcpy(filepath, kinc_internal_save_path());
		strcat(filepath, filename);
	}
	else {
		strcpy(filepath, filename);
	}
#endif
#ifdef KINC_WASM
	strcpy(filepath, filename);
#endif

#ifdef KINC_WINDOWS
	// Drive letter or network
	bool isAbsolute = (filename[1] == ':' && filename[2] == '\\') || (filename[0] == '\\' && filename[1] == '\\');
#else
	bool isAbsolute = filename[0] == '/';
#endif

	if (isAbsolute) {
		strcpy(filepath, filename);
	}
	else if (fileslocation != NULL && type != KINC_FILE_TYPE_SAVE) {
		strcpy(filepath, fileslocation);
		strcat(filepath, "/");
		strcat(filepath, filename);
	}

#ifdef KINC_WINDOWS
	MultiByteToWideChar(CP_UTF8, 0, filepath, -1, wfilepath, 1000);
	reader->data = CreateFileW(wfilepath, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (reader->data == INVALID_HANDLE_VALUE) {
		return false;
	}
#else
	reader->data = fopen(filepath, "rb");
	if (reader->data == NULL) {
		return false;
	}
#endif

#ifdef KINC_WINDOWS
	// TODO: make this 64-bit compliant
	reader->size = (size_t)GetFileSize(reader->data, NULL);
#else
	fseek((FILE *)reader->data, 0, SEEK_END);
	reader->size = ftell((FILE *)reader->data);
	fseek((FILE *)reader->data, 0, SEEK_SET);
#endif

	reader->read = kinc_libc_file_reader_read;
	reader->seek = kinc_libc_file_reader_seek;
	reader->close = kinc_libc_file_reader_close;
	reader->pos = kinc_libc_file_reader_pos;

	return true;
}

#if !defined(KINC_ANDROID)
bool kinc_file_reader_open(kinc_file_reader_t *reader, const char *filename, int type) {
	memset(reader, 0, sizeof(*reader));
	return kinc_internal_file_reader_callback(reader, filename, type) ||
	       kinc_internal_file_reader_open(reader, filename, type);
}
#endif

void kinc_file_reader_set_callback(bool (*callback)(kinc_file_reader_t *reader, const char *filename, int type)) {
	file_reader_callback = callback;
}

size_t kinc_file_reader_read(kinc_file_reader_t *reader, void *data, size_t size) {
	return reader->read(reader, data, size);
}

bool kinc_file_reader_seek(kinc_file_reader_t *reader, size_t pos) {
	return reader->seek(reader, pos);
}

bool kinc_file_reader_close(kinc_file_reader_t *reader) {
	return reader->close(reader);
}

size_t kinc_file_reader_pos(kinc_file_reader_t *reader) {
	return reader->pos(reader);
}

size_t kinc_file_reader_size(kinc_file_reader_t *reader) {
	return reader->size;
}

float kinc_read_f32le(uint8_t *data) {
	return *(float *)data;
}

uint64_t kinc_read_u64le(uint8_t *data) {
	return *(uint64_t *)data;
}

int64_t kinc_read_s64le(uint8_t *data) {
	return *(int64_t *)data;
}

uint32_t kinc_read_u32le(uint8_t *data) {
	return *(uint32_t *)data;
}

int32_t kinc_read_s32le(uint8_t *data) {
	return *(int32_t *)data;
}

uint16_t kinc_read_u16le(uint8_t *data) {
	return *(uint16_t *)data;
}

int16_t kinc_read_s16le(uint8_t *data) {
	return *(int16_t *)data;
}

uint8_t kinc_read_u8(uint8_t *data) {
	return *data;
}

int8_t kinc_read_s8(uint8_t *data) {
	return *(int8_t *)data;
}

bool kinc_file_writer_open(kinc_file_writer_t *writer, const char *filepath) {
	writer->file = NULL;

	char path[1001];
	strcpy(path, kinc_internal_save_path());
	strcat(path, filepath);

#ifdef KINC_WINDOWS
	wchar_t wpath[MAX_PATH];
	MultiByteToWideChar(CP_UTF8, 0, path, -1, wpath, MAX_PATH);
	writer->file = CreateFileW(wpath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
#else
	writer->file = fopen(path, "wb");
#endif
	if (writer->file == NULL) {
		kinc_log("Could not open file %s.", filepath);
		return false;
	}
	return true;
}

void kinc_file_writer_close(kinc_file_writer_t *writer) {
	if (writer->file != NULL) {
#ifdef KINC_WINDOWS
		CloseHandle(writer->file);
#else
		fclose((FILE *)writer->file);
#endif
		writer->file = NULL;
	}
}

void kinc_file_writer_write(kinc_file_writer_t *writer, void *data, int size) {
#ifdef KINC_WINDOWS
	DWORD written = 0;
	WriteFile(writer->file, data, (DWORD)size, &written, NULL);
#else
	fwrite(data, 1, size, (FILE *)writer->file);
#endif
}
