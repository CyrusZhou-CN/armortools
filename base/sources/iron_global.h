#pragma once

#include <stdbool.h>
#include <stdint.h>

#if defined(_WIN32)
#define KINC_WINDOWS
#elif defined(__APPLE__)
#include <TargetConditionals.h>
#if TARGET_OS_IPHONE
#define KINC_IOS
#define KINC_APPLE_SOC
#else
#define KINC_MACOS
#if defined(__arm64__)
#define KINC_APPLE_SOC
#endif
#endif
#define KINC_POSIX
#elif defined(__linux__)
#if !defined(KINC_ANDROID)
#define KINC_LINUX
#endif
#define KINC_POSIX
#endif

int kickstart(int argc, char **argv);
