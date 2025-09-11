import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Upload } from 'lucide-react';

const TransferForm = ({ 
  serverUser, 
  setServerUser, 
  serverHost, 
  setServerHost, 
  serverDir, 
  setServerDir, 
  serverPass, 
  setServerPass, 
  isTransferring, 
  handleTransfer 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Transfer Files
        </CardTitle>
        <CardDescription>Transfer downloaded files to a remote server</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverUser">Server User</Label>
              <Input
                id="serverUser"
                value={serverUser}
                onChange={(e) => setServerUser(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serverHost">Server Host</Label>
              <Input
                id="serverHost"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                placeholder="hostname or IP"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serverDir">Server Directory</Label>
            <Input
              id="serverDir"
              value={serverDir}
              onChange={(e) => setServerDir(e.target.value)}
              placeholder="/path/to/directory"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serverPass">Password (optional)</Label>
            <Input
              id="serverPass"
              type="password"
              value={serverPass}
              onChange={(e) => setServerPass(e.target.value)}
              placeholder="Password (if required)"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isTransferring}
            className="w-full"
          >
            {isTransferring ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Transferring...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Transfer Files
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferForm;