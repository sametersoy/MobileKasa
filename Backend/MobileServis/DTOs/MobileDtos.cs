using MobileServis.Models;

namespace MobileServis.DTOs;

// Devices
public record RegisterDeviceDto(string Token, DevicePlatform Platform);
