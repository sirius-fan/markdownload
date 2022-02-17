//
//  SafariWebExtensionHandler.swift
//  MarkDownload - Markdown Web Clipper Extension
//
//  Created by Gordon Pedersen on 17/2/21.
//

import SafariServices
import os.log

let SFExtensionMessageKey = "message"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

	func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message as! CVarArg)
        
        let messageDictionary = message as? [String: Any];
        
        
        let fileName = messageDictionary?["title"] as! String
//        let DocumentDirURL = try! FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        
        let paths = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask)
        let DocumentDirURL = paths[0]
        
        var fileURL = DocumentDirURL.appendingPathComponent(fileName).appendingPathExtension("md")
        
//        let savePanel = NSSavePanel()
//        savePanel.nameFieldStringValue = fileName.appending(".md")
//
//        savePanel.begin {(result: NSApplication.ModalResponse) -> Void in
//            if result == NSApplication.ModalResponse.OK {
//                if let panelURL = savePanel.url {
//                    fileURL = panelURL
//
//
//                }
//            }
//        }

        
        print("FilePath: \(fileURL.path)")

        var errorString = ""

        let writeString = messageDictionary?["markdown"] as! String
        do {
            // Write to the file
            try writeString.write(to: fileURL, atomically: true, encoding: String.Encoding.utf8)
        } catch let error as NSError {
            errorString = "Failed writing to URL: \(fileURL), Error: " + error.localizedDescription
        }
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response to": message,
                                                       "messageDisctionary": messageDictionary,
                                                       "markdown": messageDictionary?["markdown"],
                                                       "errorString": errorString,
                                                       "fileUrl": fileURL.path,
                                                       "mdClipsFolder": messageDictionary?["mdClipsFolder"],
                                                       "DocumentDirURL": DocumentDirURL.path
                                                     ]]

        context.completeRequest(returningItems: [response], completionHandler: nil)
        
    }
    
}
