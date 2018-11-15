(
~listener = {|msg, time, replyAddr, recvPort|
	if (msg[0] != "/status.reply", {
		// Log all received messages to the console.
		// (recvPort + "from " + replyAddr.ip + ":" + replyAddr.port + ":" + msg).postln;
		(msg).postln;
	});
};

thisProcess.addOSCRecvFunc(~listener);
)

thisProcess.removeOSCRecvFunc(~listener);