'use strict'
var reportGraph = new CanvasJS.Chart("reportGraph",
	{
		title:{

			verticalAlign: 'top',
			horizontalAlign: 'left'
		},
        animationEnabled: true,
		data: [
		{
			type: "doughnut",
			startAngle:20,
			toolTipContent: "{label}: {y} - <strong>#percent%</strong>",
			indexLabel: "{label} #percent%",
			dataPoints: [
				{  y: 67, label: "Present" },
				{  y: 28, label: "Absent" },
				{  y: 10, label: "Leaves" }
			]
		}
		]
	});
$('#reportModal').hide().fadeIn('fast');
reportGraph.render();
$('#reportModal').hide();
