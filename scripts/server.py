import sys
import BaseHTTPServer
import socket
from SimpleHTTPServer import SimpleHTTPRequestHandler
from urlparse import urlparse, parse_qs
import relay
from tellcore.telldus import TelldusCore
import argparse
from threading import Thread
from time import sleep
import urllib2

devices = [ (0,"telldus","Chaufferette"), #1
            (1,"telldus","Haut"), #2
            (2,"telldus","Webcam"), #3
            (1,"relay","Lampe bas"), #4
            (4,"relay","Bloc gauche"), #5
            (2,"relay","Radiateur"), #6
            (8,"relay","Bloc droit"), #7
            (16,"relay","Lampe bureau"), #8
            (0,"motion","Webcam 2")] #9


groups = {  
            'Home':(-3,4,5,-6,7,8,-9),
            'Sleep':(-1,-2,-3,-4,-5,-7,-8,-9),
            'default':(-1,-2,3,-4,-5,-6,-7,-8,9)}
    
class Group:
    name = "group"
    
    @staticmethod
    def command(command,group_id):
            resp = ""
            if (group_id in groups):
                group = groups[group_id]
            else:
                group = groups['default']
            
            for did in group:
                device = devices[abs(did) - 1]
                if (did < 0):
                    c = not command
                else:
                    c = command

                modules[device[1]].command(c,device[0])
                resp += device[2] + " is now " + str(c) + "<br />" 
            print resp
            return resp
            
class Telldus:
    name = "telldus"
    
    @staticmethod
    def command(command,device_id):
        if ((command == "E") or (command == "0") or (command == 0) or (command == "OFF") or (command == False)):
            command = False
        else:
            command = True
        
        core = TelldusCore()
        d = core.devices()[device_id]
        if (not command):
            d.turn_off()
        elif (command):
            d.turn_on()
        return d.name + " is now " + str(command) 
        
class Motion:
    name = "motion"
    
    @staticmethod
    def command(command,device_id):
        if ((command == "E") or (command == "0") or (command == 0) or (command == "OFF") or (command == False)):
            command = False
        else:
            command = True
        
        try:
            if (not command):
                surl = "/"+str(device_id) +"/detection/pause"
            elif (command):
                surl = "/" + str(device_id) +"/detection/start"      
            import httplib
            conn = httplib.HTTPConnection(host='127.0.0.1',port=8080,timeout=5)
            conn.request('GET',surl)
            content = conn.getresponse().read()
            print "Calling " + surl            
            
        except:
            pass    
        return "Webcam " + str(device_id) + " is now " + str(command) 
        
class Relay:
    name = "relay"
    
    @staticmethod
    def command(command,device_id):
        if (command == "0" or command == False):
            command = "E"
        elif (command == "1" or command == True):
            command = "A"
        relay.relay_command(command,device_id)
        return str(device_id) + " is now " + command

modules = {"relay":Relay,"telldus":Telldus,"motion":Motion}

class MyHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def r404(self):
        self.send_response(404)
        return

    def __init__(self,req,client_addr,server):
            SimpleHTTPRequestHandler.__init__(self,req,client_addr,server)
            
    def do_GET(self):    
        self._do_GET(True)

    def do_HEAD(self):
	self._do_GET(False)        

    def _do_GET(self,write):
        print 'get'
        uri = parse_qs(urlparse(self.path).query)
        print uri
        if (not 'module' in uri) or (uri["module"]!=["list"] and ((not 'id' in uri) or (not 'c' in uri))):
                 return self.r404()
        resp = ""
        
        if 'host' in  self.headers:
            addr = "http://" + self.headers['host'] + "/"
        else:
            addr = SERVER_ADDRESS
        
        if (uri["module"] == ["relay"]):
            device_id = int(uri['id'][0])
            command = uri['c'][0]
            resp = Relay.command(command,device_id)
        elif (uri["module"] == ["telldus"]):
            device_id = int(uri['id'][0])
            command = uri['c'][0]
            resp = Telldus.command(command,device_id)
        elif (uri["module"] == ["motion"]):
            device_id = int(uri['id'][0])
            command = uri['c'][0]
            resp = Motion.command(command,device_id)

        elif (uri["module"] == ["group"]):
            group_id = uri['id'][0]
            command = uri['c'][0]
                        
            resp = Group.command(command,group_id)
        elif (uri["module"] == ["list"]):
            resp += "<table style=\"font-size:28px;\">"
            for device in devices:
                resp += "<tr><td>" +str (device[2]) + " <a href=\""+addr+"?module=" + device[1] + "&id=" + str(device[0]) + "&c=1&back=1\">ON</a></td><td>" +str (device[2]) + " <a href=\""+addr+"?module=" + device[1] + "&id=" + str(device[0]) + "&c=0&back=1\">OFF</a><br /></td></tr>"
            for group in groups:
                resp += "<tr><td>" +str (group) + " <a href=\""+addr+"?module=group&id=" + str(group) + "&c=1&back=1\">ON</a></td><td>" +str (group) + " <a href=\""+addr+"?module=group&id=" + str(group) + "&c=0&back=1\">OFF</a><br /></td></tr>"
            resp += "</table>"
        else:
            return self.r404()
            
        if (resp == 404):
            self.r404()
        resp += "<br/><br /><a href=\"javascript:history.go(-1);\">Back</a>"
        
        if ('back' in uri):
            resp += "<script type=\"text/javascript\">window.location.replace('/?module=list&c=0&id=0');</script>"
            
        resp = "<!DOCTYPE html><html><head></head><body style=\"font-size:28px;\"><div>" + resp + "</div></body></html>" 
        self.rfile._sock.settimeout(5)
        self.wfile._sock.settimeout(5)
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.send_header("Content-length", len(resp))
        self.end_headers()
        if (write):
		self.wfile.write(resp)


class HTTPServerV6(BaseHTTPServer.HTTPServer):
    address_family = socket.AF_INET6
    def get_request(self):
        self.socket.settimeout(5.0)
        result = None
        print "timeout"
        while result is None:
            try:
                result = self.socket.accept()
            except socket.timeout:
                pass
        result[0].settimeout(None)
        return result    

def main():

    parser = argparse.ArgumentParser(description='Light http server for domotic relay')
    parser.add_argument('-a','--host', 
                        action='store',
                        dest="SERVER_HOST",
                        default="localhost",
                        help='the host address to access this server')
    parser.add_argument('-p', '--port', 
                        action='store',
                        dest="SERVER_PORT",
                        default=7272,
                        help='port to listen on')

    args = parser.parse_args()
    globals().update(vars(args))
    global SERVER_ADDRESS
    SERVER_ADDRESS = "http://" + SERVER_HOST + ":" + str(SERVER_PORT) + "/"
    print "Link to server is " + SERVER_ADDRESS
    ServerClass  = HTTPServerV6
    server_address = ('::', int(SERVER_PORT))

    httpd = ServerClass(server_address, MyHandler)
    httpd.socket.settimeout(5.0);
    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."
    httpd.serve_forever()

if __name__ == "__main__":
    main()
    

