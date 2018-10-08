import React from 'react'
import Link from 'redux-first-router-link'

export default () => (
	<div>
		<p>Teaching people scientific concepts is often difficult. This is especially so when it concerns abstract mathematical subjects. The interactive book you're looking at now is my attempt to change that.</p>
		<h4>If I would write a book, I wouldn't ...</h4>
		<p>While writing my <a href="http://www.hildobijl.com/Research.php" target="_blank" rel="noopener noreferrer">Ph.D. thesis</a> on Gaussian Process (GP) regression, I asked myself a question. "If I would write a book that explains GP regression to people not familiar with the field, how would I set it up?" My first thought was that I would use intuitive explanations whenever possible. Most books focus on the raw mathematics, while it is the different ways of looking at concepts that truly allow readers to thoroughly understand them. This also led to my second thought: to accomplish this intuitive way of explaining, my work couldn't be a traditional book. It had to be interactive. And that's how the idea of this app formed.</p> 
		<h4>... I'd make more than a book</h4>
		<p>To keep things familiar for people, this app works just like a book, but with a few notable differences.</p>
		<ul>
			<li>Every figure you see is interactive. By playing around with it, you understand what it's about.</li>
			<li>Equations are optional. You can read pretty much the entire book without seeing a single equation. But if you like the mathematics, go to the <Link to={{ type: 'SETTINGS' }}>Settings</Link> page to turn them on.</li>
			<li>There is no linear order of chapters. Instead, there is a <Link to={{ type: 'TREE' }}>Contents Tree</Link>. Decide what you want to learn, and you'll directly see what you need to read to get there.</li>
		</ul>
		<p>This interactive book is as experimental as it gets. That's why I'm curious about your thoughts. Whatever you're thinking right now, write it down in an email and send it to <a href="mailto:info@hildobijl.com" target="_blank" rel="noopener noreferrer">info@hildobijl.com</a>. I'd love to read/hear all about it.</p>
	</div>
)