Pod::Spec.new do |s|
  s.name             = 'CapWordsForegroundRemoval'
  s.version          = '1.0.0'
  s.summary          = 'On-device foreground removal using Apple Vision.'
  s.description      = 'Creates a transparent foreground image from a local CapWords photo.'
  s.author           = 'CapWords Study'
  s.homepage         = 'https://capwords.app/'
  s.platforms        = { :ios => '16.4' }
  s.source           = { git: '' }
  s.static_framework = true
  s.swift_version    = '5.0'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'CoreImage', 'CoreVideo', 'ImageIO', 'UniformTypeIdentifiers'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
