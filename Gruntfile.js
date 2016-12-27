'use strict';
module.exports = function(grunt) {
	//任务配置
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		name: 'mycode',
		srcPath: 'src',//源目录
		distPath: 'build',//输出目录
		assetsPath: 'assets',//资源目录
		
		compass: { // Task 
			dist: { // Target 
				options: {
			        config: '<%= srcPath %>/config.rb'
			    }
			}
		},
		copy: {
			main: {
				files:[{
						expand: true,
					    cwd: '<%= srcPath %>/',
					    src: ['**/*.{css,js,html,png,jpg,ttf,svg,woff}'],
					    dest: '<%= distPath %>/'
				}]
			},
			assert:{
				expand: true,
			    cwd: '<%= srcPath %>/',
			    src: 'img/*',
			    dest: '<%= distPath %>/'
			}
		},
		clean: {
			build:{
				src:['<%= distPath %>/**/*'],
				filter:"isFile"
			}
		},
		jshint: {
            all: [
                '<%= srcPath %>/js/**/*.js'
            ]
        },
		uglify: {
			main: {
				files: [{
					expand: true,
					cwd: '<%= srcPath %>/js',
					src: ['**/*.js'],
					dest: '<%= distPath %>/js'
				}]
			}
		},
		cssmin: {
			main: {
				files: [{
					expand: true,
					cwd: '<%= srcPath %>/css',
					src: ['**/*.css'],
					dest: '<%= distPath %>/css'
				}]
			}
		},
		watch: {
			livereload: {
                options: {
                    livereload: '<%=connect.options.livereload%>'  //监听前面声明的端口  35729
                },
                files: [  //下面文件的改变就会实时刷新网页
                    '<%= srcPath %>/**/*.html',
                    '<%= srcPath %>/**/*.js',
                    '<%= srcPath %>/**/*.css',
                    '<%= srcPath %>/{,*/}*.{png,jpg}'
                ]
            },
			css: {
				files: ['<%= srcPath %>/**/*.scss'],
				tasks: ['compass']
			}
		},
		connect: {
			options: {
				port: 9001,
				hostname: '*', //默认就是这个值，可配置为本机某个 IP，localhost 或域名
				livereload: 35729 //声明给 watch 监听的端口
			},
			server: {
				options: {
					open: true, //自动打开网页 http://
					base: [
						'<%= srcPath %>' //主目录
					]
				}
			}
		}
	});
	//加载所有任务
	require('load-grunt-tasks')(grunt, {
        scope: 'devDependencies'
    });
    require('time-grunt')(grunt);//时间插件
    
    //自定义组合任务
	grunt.registerTask('build', ['clean:build','copy:assert','cssmin','uglify']);//压缩任务
	grunt.registerTask('default', ['build']);
	grunt.registerTask('dev', ['connect','watch']);//实时开发任务
}