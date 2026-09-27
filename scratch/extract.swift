import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

let videoPath = "/Users/Tarfeen/Downloads/novacart demo3.mp6.mp4"
let videoURL = URL(fileURLWithPath: videoPath)
let asset = AVURLAsset(url: videoURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let durationSeconds = CMTimeGetSeconds(asset.duration)
print("Video duration: \(durationSeconds) seconds")

let scratchDir = "/Users/Tarfeen/.gemini/antigravity-ide/brain/4e463784-7fa2-4bda-b259-bdd517206628/scratch"
let count = 6
for i in 0..<count {
    let t = Double(i) * (durationSeconds / Double(count)) + 0.5
    let time = CMTime(seconds: min(t, durationSeconds - 0.1), preferredTimescale: 600)
    do {
        let cgImage = try generator.copyCGImage(at: time, actualTime: nil)
        let destURL = URL(fileURLWithPath: "\(scratchDir)/frame_\(i).jpg") as CFURL
        if let dest = CGImageDestinationCreateWithURL(destURL, "public.jpeg" as CFString, 1, nil) {
            CGImageDestinationAddImage(dest, cgImage, nil)
            CGImageDestinationFinalize(dest)
            print("Extracted frame \(i) at \(time.seconds)s")
        }
    } catch {
        print("Error at \(t)s: \(error)")
    }
}
