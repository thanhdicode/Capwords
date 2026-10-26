import CoreImage
import CoreVideo
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

public class CapWordsForegroundRemovalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CapWordsForegroundRemoval")

    AsyncFunction("removeForeground") { (uri: String) -> [String: Any] in
      guard #available(iOS 17.0, *) else {
        return ["status": "unsupported", "reason": "ios-version"]
      }
      guard let sourceURL = URL(string: uri), sourceURL.isFileURL else {
        return ["status": "unsupported", "reason": "unsupported-source"]
      }

      do {
        return try Self.removeForeground(from: sourceURL)
      } catch {
        return ["status": "failed", "reason": "processing-error"]
      }
    }
  }

  @available(iOS 17.0, *)
  private static func removeForeground(from sourceURL: URL) throws -> [String: Any] {
    let handler = VNImageRequestHandler(url: sourceURL, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([request])

    guard let observation = request.results?.first,
      !observation.allInstances.isEmpty
    else {
      return ["status": "no-foreground"]
    }

    let maskedPixels = try observation.generateMaskedImage(
      ofInstances: observation.allInstances,
      from: handler,
      croppedToInstancesExtent: false
    )
    let maskedImage = CIImage(cvPixelBuffer: maskedPixels)
    let context = CIContext(options: [.cacheIntermediates: false])
    guard let outputImage = context.createCGImage(maskedImage, from: maskedImage.extent) else {
      throw NSError(domain: "CapWordsForegroundRemoval", code: 1)
    }

    let outputData = NSMutableData()
    guard let destination = CGImageDestinationCreateWithData(
      outputData as CFMutableData,
      UTType.png.identifier as CFString,
      1,
      nil
    ) else {
      throw NSError(domain: "CapWordsForegroundRemoval", code: 2)
    }
    CGImageDestinationAddImage(destination, outputImage, nil)
    guard CGImageDestinationFinalize(destination) else {
      throw NSError(domain: "CapWordsForegroundRemoval", code: 3)
    }

    let cacheDirectory = try FileManager.default.url(
      for: .cachesDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    let outputDirectory = cacheDirectory.appendingPathComponent(
      "CapWordsForegroundRemoval",
      isDirectory: true
    )
    try FileManager.default.createDirectory(
      at: outputDirectory,
      withIntermediateDirectories: true
    )
    let outputURL = outputDirectory.appendingPathComponent("\(UUID().uuidString).png")
    try (outputData as Data).write(to: outputURL, options: .atomic)

    return [
      "status": "processed",
      "uri": outputURL.absoluteString,
      "mimeType": "image/png",
      "width": CVPixelBufferGetWidth(maskedPixels),
      "height": CVPixelBufferGetHeight(maskedPixels),
    ]
  }
}
