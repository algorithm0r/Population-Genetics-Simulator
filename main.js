var gameEngine = new GameEngine();

var ASSET_MANAGER = new AssetManager();

var socket = null;
if (window.io !== undefined) {
	console.log("Database connected!");

	socket = io.connect(PARAMS.ip);

	socket.on("connect", function () {
		databaseConnected();
	});
	
	socket.on("disconnect", function () {
		databaseDisconnected();
	});

	socket.addEventListener("log", console.log);
}

function reset() {
	loadParameters();
	gameEngine.entities = [];	
	gameEngine.graphs = [];
	new Automata();
};

ASSET_MANAGER.downloadAll(function () {
	console.log("starting up da sheild");
	var canvas = document.getElementById('gameWorld');
	var ctx = canvas.getContext('2d');

    // Initialize environment parameter UI
    updateEnvironmentUI();
    
    // Add event listeners for pattern dropdowns
    document.getElementById('environmentPattern').addEventListener('change', updateEnvironmentUI);
    document.getElementById('environmentDynamics').addEventListener('change', updateEnvironmentUI);

	gameEngine.init(ctx);

	reset();

	gameEngine.start();
});
