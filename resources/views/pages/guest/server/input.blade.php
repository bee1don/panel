@extends('layouts.guest.master')
@section('content')
    <header class="page-header-ui page-header-ui-dark bg-gradient-lime-to-green">
        <div class="page-header-ui-content pt-10">
            <div class="container text-center">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <h1 class="page-header-ui-title">Create {{ $category->name }} Account</h1>
                        <p class="lead">Server {{ $category->name }} {{ $server->name }} on {{ $server->country->name }}
                        </p>
                        <p class="page-header-ui-text">All services come with 1Gbps Bandwidth! Powerful compute backed by
                            100%
                            SSD storage. Create instantly!</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="svg-border-waves text-white">
            <svg class="wave" style="pointer-events: none" fill="currentColor" preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1920 75">
                <defs>
                    <style>
                        .a {
                            fill: none;
                        }

                        .b {
                            clip-path: url(#a);
                        }

                        .d {
                            opacity: 0.5;
                            isolation: isolate;
                        }
                    </style>
                    <clippath id="a">
                        <rect class="a" width="1920" height="75"></rect>
                    </clippath>
                </defs>
                <title>wave</title>
                <g class="b">
                    <path class="c"
                        d="M1963,327H-105V65A2647.49,2647.49,0,0,1,431,19c217.7,3.5,239.6,30.8,470,36,297.3,6.7,367.5-36.2,642-28a2511.41,2511.41,0,0,1,420,48">
                    </path>
                </g>
                <g class="b">
                    <path class="d"
                        d="M-127,404H1963V44c-140.1-28-343.3-46.7-566,22-75.5,23.3-118.5,45.9-162,64-48.6,20.2-404.7,128-784,0C355.2,97.7,341.6,78.3,235,50,86.6,10.6-41.8,6.9-127,10">
                    </path>
                </g>
                <g class="b">
                    <path class="d"
                        d="M1979,462-155,446V106C251.8,20.2,576.6,15.9,805,30c167.4,10.3,322.3,32.9,680,56,207,13.4,378,20.3,494,24">
                    </path>
                </g>
                <g class="b">
                    <path class="d"
                        d="M1998,484H-243V100c445.8,26.8,794.2-4.1,1035-39,141-20.4,231.1-40.1,378-45,349.6-11.6,636.7,73.8,828,150">
                    </path>
                </g>
            </svg>
        </div>
    </header>

    <section class="bg-white py-10">
        <div class="container px-5">
            <div class="row justify-content-md-center features text-center mb-10">
                <div class="col-12 col-lg-4 mb-2">
                    {!! getBannerSettings('responsive_full') !!}
                </div>
                <div class="col-12 mb-2 text-center col-lg-4 card card-link border-top-lg border-teal h-100">
                    <div class="gx-5 mt-2" id="result_account">
                        <div class="alert alert-success text-center p-2" style="font-size: 14px;">
                            <strong>Success!</strong> Account has been successfully created.
                            <hr>
                            <div id="result"></div>
                            <br>
                        </div>
                        <button type="button" data-element="copy"
                            class="d-block btn btn-outline-teal btn-block w-100 mb-4">
                            Copy Account
                        </button>
                    </div>
                    <div class="row" id="input_account">
                        <div class="col-12 p-3">
                            <h4>CREATE NEW ACCOUNT</h4>
                            <h5>{{ Str::upper($category->name) . ' ' . Str::upper($server->slug) }} </h5>
                        </div>
                        <div class="col-12 mb-4 overflow-hidden">
                            <form id="create_account" method="POST"
                                action="{{ route('server.store', ['slug' => $server->slug]) }}">
                                <div class="form-group mb-4">
                                    <input type="text" name="username" class="form-control" id="username"
                                        placeholder="Username">
                                    <br>
                                    @if ($server->category->slug == 'ssh')
                                        <input type="password" name="password" class="form-control" id="password"
                                            placeholder="Password">
                                    @else
                                        <input type="text" name="bug" class="form-control" id="bug"
                                            placeholder="Bug">
                                    @endif
                                </div>
                                <div class="form-group mb-4">
                                    {!! NoCaptcha::display() !!}
                                    {!! NoCaptcha::renderJs('recaptchaCallback') !!}
                                </div>
                                <button type="submit" name="submit" class="d-block btn btn-outline-teal btn-block w-100">
                                    Create Now
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-4 mb-2">
                    {!! getBannerSettings('responsive_full') !!}
                </div>
                <div class="col-12 mt-5">
                    <p class="small">
                        <span class="badge bg-success">Active Valid for 3 days</span>
                        <span class="badge bg-info">Support SSH Websocket</span>
                        <span class="badge bg-primary">High Speed Connection</span>
                        <span class="badge bg-success">Hide Your IP</span>
                        <span class="badge bg-info">Premium SSH Websocket Server</span>
                        <span class="badge bg-warning">Worldwide Servers</span>
                        <span class="badge bg-danger">No DDOS</span>
                        <span class="badge bg-danger">No Hacking</span>
                        <span class="badge bg-danger">No Carding</span>
                        <span class="badge bg-danger">No Torrent</span>
                    </p>
                    <p class="text-left small">
                        Note: Multiple login will causing disconnect and Lagging for your account, we recommend using one
                        account for one device to avoid disconnect when using your account.
                        <br><br>
                        <br><br>
                        When logged into your account, the entire login session including the transmission of the password
                        is
                        encrypted; almost impossible for any outsider to collect passwords. Compared to the Telnet remote
                        shell protocols which send the transmission, e.g. the password in a plain text, SSH was basically
                        designed to replace Telnet and other insecure remote shell with encryption to provide anonymity and
                        security through unsecured network. In short, it provides a much safer environment for browsing.<br>
                    <div class="mb-4 mt-4">
                        {!! getBannerSettings('responsive_full') !!}
                    </div>
                    <br>
                    Another advantage of using Secure Shell tunnel is to use it to bypass the firewall; therefore, accessing
                    blocked websites from the ISPs. It is also useful to access several websites which blocked any foreign
                    access or from certain countries. While using the Secure Shell tunnel, the client’s IP will be changed
                    to the host’s IP; giving the client’s IP access to the regional-blocked websites. Connecting to a host
                    closer to your location is recommended to increase your internet connection’s speed.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="bg-white pt-5">
        <div class="container px-5">
            <div class="row gx-5">
                <div class="col-lg-6 mb-lg-n20 mb-5 mb-lg-5 z-1">
                    <a class="card text-decoration-none lift" href="#!">
                        <div class="card-body py-5">
                            <div class="d-flex align-items-center">
                                <div class="icon-stack icon-stack-xl bg-gradient-lime-to-green text-white flex-shrink-0">
                                    <i data-feather="shield"></i>
                                </div>
                                <div class="ms-4">
                                    <h5 class="text-teal">Privacy & Security</h5>
                                    <p class="card-text text-gray-500">Get your identity hidden online, your
                                        IP Address will
                                        be masked with our server IP. Also your connection will be
                                        encrypted.</p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-lg-6 mb-lg-n20 mb-5 mb-lg-5 z-1">
                    <a class="card text-decoration-none lift" href="#!">
                        <div class="card-body py-5">
                            <div class="d-flex align-items-center">
                                <div class="icon-stack icon-stack-xl bg-gradient-lime-to-green text-white flex-shrink-0">
                                    <i data-feather="unlock"></i>
                                </div>
                                <div class="ms-4">
                                    <h5 class="text-teal">Bypass Cencorship</h5>
                                    <p class="card-text text-gray-500">Bypass your school, government or
                                        your office
                                        internet cencorship. Unblock any site and enjoy Internet Freedom.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-lg-6 mb-lg-n10 mb-5 mb-lg-5 z-1">
                    <a class="card text-decoration-none lift" href="#!">
                        <div class="card-body py-5">
                            <div class="d-flex align-items-center">
                                <div class="icon-stack icon-stack-xl bg-gradient-lime-to-green text-white flex-shrink-0">
                                    <i data-feather="zap"></i>
                                </div>
                                <div class="ms-4">
                                    <h5 class="text-teal">Boost Internet Speed</h5>
                                    <p class="card-text text-gray-500">Our service may boost your internet
                                        speed and make
                                        your connection stable (stable PING) with. This differ by country.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-lg-6 mb-lg-n10 mb-5 mb-lg-5 z-1">
                    <a class="card text-decoration-none lift" href="#!">
                        <div class="card-body py-5">
                            <div class="d-flex align-items-center">
                                <div class="icon-stack icon-stack-xl bg-gradient-lime-to-green text-white flex-shrink-0">
                                    <i data-feather="activity"></i>
                                </div>
                                <div class="ms-4">
                                    <h5 class="text-teal">Stable Server</h5>
                                    <p class="card-text text-gray-500">Faster Connections, full speed SSH
                                        Account with with
                                        best quality server up to 10 Gbit connection</p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <section class="bg-light py-10">
        <div class="container">
            <div class="row align-items-center justify-content-center">
                <div class="col-md-9 col-lg-6 order-1 order-lg-0" data-aos="fade-right">
                    <br />
                    <img class="img-fluid" src="{{ asset('guests/assets/img/faqs-2.svg') }}" />
                </div>
                <div class="col-lg-6 order-0 order-lg-1 mb-5 mb-lg-0" data-aos="fade-left">
                    <div class="mb-5">
                        {!! $category->description !!}
                    </div>
                </div>
            </div>
    </section>
@endsection
@section('scripts')
    <script src="{{ asset('js/FormControls.js') }}"></script>
    <script>
        "use strict";
        // Class definition
        const formEl = $('#create_account');
        const resultEl = $('#result_account');
        const inputEl = $('#input_account');
        resultEl.hide();

        // on form submit
        formEl.on('submit', function(e) {
            e.preventDefault();
            const form = $(this);
            const btn = $(this).find('[type="submit"]');
            btn.addClass('spinner spinner-white spinner-right').attr('disabled', true);
            $.ajax({
                url: form.attr('action'),
                method: 'POST',
                data: form.serialize(),
                success: function(response) {
                    if (response.status == 'success') {
                        Swal.fire({
                            title: 'Success!',
                            text: response.message,
                            icon: 'success',
                            confirmButtonText: 'Ok',
                            allowOutsideClick: false
                        }).then((result) => {
                            if (result.isConfirmed) {
                                $('#result').html(response.output);
                                resultEl.show();
                                inputEl.hide();
                            }
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: response.message,
                            icon: 'error',
                            confirmButtonText: 'Ok',
                            allowOutsideClick: false
                        });
                    }
                },
                error: function(xhr, status, error) {
                    const response = xhr.responseJSON;
                    if ($.isEmptyObject(response) == false) {
                        $.each(response.errors, function(key, value) {
                            Swal.fire({
                                title: 'Error!',
                                text: value,
                                icon: 'error',
                                confirmButtonText: 'Ok',
                                allowOutsideClick: false
                            });
                        });
                    }
                },
                complete: function() {
                    btn.removeClass('spinner spinner-white spinner-right').attr('disabled', false);
                }
            });
        });

        function copyToClipboard(element, message) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val($(element).text()).select();
            document.execCommand("copy");
            $temp.remove();
            Swal.fire({
                text: message,
                icon: "success",
                buttonsStyling: false,
                confirmButtonText: "Ok, got it!",
                customClass: {
                    confirmButton: "btn btn-teal"
                }
            });
        }
    </script>
@endsection
