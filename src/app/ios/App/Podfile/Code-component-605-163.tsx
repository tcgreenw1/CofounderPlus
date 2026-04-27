require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '13.0'
use_frameworks!

# workaround to avoid Xcode caching of Pods that requires
# Product -> Clean Build Folder after new Cordova plugins installed
# Requires CocoaPods 1.6 or newer
install! 'cocoapods', :disable_input_output_paths => true

def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCommunityAppleSignIn', :path => '../../node_modules/@capacitor-community/apple-sign-in'
  pod 'CapacitorCommunityInAppPurchases', :path => '../../node_modules/@capacitor-community/in-app-purchases'
  pod 'CapacitorApp', :path => '../../node_modules/@capacitor/app'
  pod 'CapacitorBrowser', :path => '../../node_modules/@capacitor/browser'
  pod 'CodetrixStudioCapacitorGoogleAuth', :path => '../../node_modules/@codetrix-studio/capacitor-google-auth'
end

target 'App' do
  capacitor_pods
  # Add your Pods here
end

post_install do |installer|
  assertDeploymentTarget(installer)
  
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Ensure iOS 13.0+ deployment target across all pods
      if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 13.0
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
      end
    end
  end
end
